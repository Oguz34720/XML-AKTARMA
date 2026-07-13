import { Router } from 'express';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { previewChanges, commitChanges } from '../../lib/hitl.js';
import { normalizeVendor } from '../../lib/vendorRules.js';
import { geminiGenerate } from '../../lib/geminiClient.js';

const router = Router();

// ==========================================
// 1. Pazaryeri Durumu (Metafield)
// ==========================================
router.post('/pazaryeri', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        const newValue = item.current.value === "true" ? "false" : "true";
        return { value: newValue };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation productUpdatePazaryeri($id: ID!, $value: String!) {
          productUpdate(input: {id: $id, metafields: [{namespace: "sidekick", key: "pazaryeri_durumu", type: "boolean", value: $value}]}) {
            product { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Pazaryeri Durumu');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. Ürün Durum Yöneticisi
// ==========================================
router.post('/urun-durum', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        return { status: item.current.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation productUpdateStatus($id: ID!, $status: ProductStatus!) {
          productUpdate(input: {id: $id, status: $status}) {
            product { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Ürün Durumu');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Vendor Toplu Güncelle
// ==========================================
router.post('/vendor', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        return { vendor: normalizeVendor(item.current.vendor) };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation productUpdateVendor($id: ID!, $vendor: String!) {
          productUpdate(input: {id: $id, vendor: $vendor}) {
            product { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Vendor Güncelleme');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Koleksiyon Atama
// ==========================================
router.post('/koleksiyon', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        // item.current.collectionId needs to be passed from the frontend request
        return { collectionId: item.current.collectionId };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation addToCollection($id: ID!, $collectionId: ID!) {
          collectionAddProducts(id: $collectionId, productIds: [$id]) {
            collection { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Koleksiyon Atama');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SEO Optimizasyon
// ==========================================
router.post('/seo', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      // previewChanges callback is synchronous, but we need async for Gemini
      // So we map manually or adapt
      const previews = [];
      for (const item of items) {
        const prompt = `Generate a highly optimized SEO title and description in Turkish for this product: ${item.current.title}. Return a JSON object with 'title' and 'description' keys.`;
        try {
          const aiResponse = await geminiGenerate(prompt);
          let seoData = { title: "", description: "" };
          try {
            // strip markdown formatting if any
            const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '');
            seoData = JSON.parse(cleaned);
          } catch(e) {
            console.error("Failed to parse Gemini response:", aiResponse);
          }
          previews.push({
            id: item.id,
            original: item.current,
            proposed: { title: seoData.title, description: seoData.description },
            approved: false
          });
        } catch (e) {
          console.error("Gemini failed", e);
        }
      }
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation productUpdateSEO($id: ID!, $title: String!, $description: String!) {
          productUpdate(input: {id: $id, seo: {title: $title, description: $description}}) {
            product { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'SEO Optimizasyon');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Arşiv Yöneticisi
// ==========================================
router.post('/arsiv', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        return { status: 'ARCHIVED' };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation productArchive($id: ID!) {
          productUpdate(input: {id: $id, status: ARCHIVED}) {
            product { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Arşiv Yöneticisi');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Yayın Kanalı Yöneticisi
// ==========================================
router.post('/yayin-kanali', async (req, res) => {
  try {
    const { action, items } = req.body;
    const session = res.locals.shopify.session;

    if (action === 'preview') {
      const previews = await previewChanges(items, (item) => {
        // Requires publicationId to be provided in the current item
        return { publicationId: item.current.publicationId };
      });
      return res.json({ previews });
    } else if (action === 'commit') {
      const mutation = `
        mutation publishProduct($id: ID!, $publicationId: ID!) {
          publishablePublish(id: $id, input: [{publicationId: $publicationId}]) {
            publishable { id }
            userErrors { message }
          }
        }
      `;
      await commitChanges(session, items, mutation, 'Yayın Kanalı Yöneticisi');
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
