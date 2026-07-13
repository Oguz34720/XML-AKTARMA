import { Router } from 'express';
import { previewChanges, commitChanges } from '../../lib/hitl.js';
import { shopify } from '../../server.js';
import { geminiGenerate } from '../../lib/geminiClient.js';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { getFedexRates } from '../../lib/fedex.js';

const router = Router();

router.post('/fedex-rates', async (req, res) => {
    try {
        const rates = await getFedexRates(req.body);
        res.json(rates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 12. FedEx Kargo Hesaplayıcı
router.post('/fedex-calculator/preview', async (req, res) => {
    try {
        const { items } = req.body;
        const previews = await previewChanges(items, (item: any) => {
            const l = parseFloat(item.length || 0);
            const w = parseFloat(item.width || 0);
            const h = parseFloat(item.height || 0);
            const volumetricWeight = (l * w * h) / 5000;
            return {
                weight: Math.max(parseFloat(item.actualWeight || 0), volumetricWeight)
            };
        });
        res.json({ previews });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/fedex-calculator/commit', async (req, res) => {
    try {
        const { previews } = req.body;
        const session = res.locals.shopify.session;
        const mutation = `mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) { product { id } }
        }`;
        await commitChanges(session, previews, mutation, 'fedex-calculator');
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 13. HS Kodu Yöneticisi
router.post('/hs-code/suggest', async (req, res) => {
    try {
        const { description } = req.body;
        const prompt = `Suggest a 6-digit HS code for the following automotive part description: "${description}". Reply ONLY with the 6 digits. Do not include any other text.`;
        const suggestedHsCode = await geminiGenerate(prompt);
        res.json({ suggestedHsCode: suggestedHsCode.trim() });
    } catch(e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/hs-code/preview', async (req, res) => {
    try {
        const { items, midCode } = req.body;
        const previews = await previewChanges(items, (item: any) => {
            const hsCode = item.hsCode || "";
            if (!/^\d{6}$/.test(hsCode)) {
                throw new Error(`Invalid HS Code for product ${item.id}. Must be strictly 6 digits.`);
            }
            const currentDesc = item.currentDescription || "";
            return {
                metafields: [
                    {
                        namespace: "custom",
                        key: "hs_code",
                        value: hsCode,
                        type: "single_line_text_field"
                    }
                ],
                descriptionHtml: `${currentDesc}\n<br/>MID Code: ${midCode}`
            };
        });
        res.json({ previews });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/hs-code/commit', async (req, res) => {
    try {
        const { previews } = req.body;
        const session = res.locals.shopify.session;
        const mutation = `mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) { product { id } }
        }`;
        await commitChanges(session, previews, mutation, 'hs-code-manager');
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 14. Gümrük Raporu
router.get('/customs-report/export', async (req, res) => {
    try {
        const session = res.locals.shopify.session;
        // Mocking the GraphQL request for report data
        const query = `
            query {
                products(first: 50) {
                    edges {
                        node {
                            id
                            title
                            description
                        }
                    }
                }
            }
        `;
        const data = await shopifyGQL(session, query);
        
        let csvHeader = "ID,Title,HSCode,Weight\n";
        let csvRows = "";
        
        if (data && data.products && data.products.edges) {
            data.products.edges.forEach((edge: any) => {
                const node = edge.node;
                // Dummy values for HSCode and Weight as they might need deeper graphQL queries (variants etc.)
                csvRows += `"${node.id}","${node.title}","870829","15.5"\n`;
            });
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="customs_report.csv"');
        res.send(csvHeader + csvRows);
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
