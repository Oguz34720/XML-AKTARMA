import express from 'express';
import { previewChanges, commitChanges } from '../../lib/hitl.js';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { getStoreConfig, setStoreConfig } from '../../lib/encryption.js';
import { shopContext } from '../../lib/shopContext.js';

const router = express.Router();
router.use(shopContext);

// --- Multi-Store Config ---
router.get('/store-config', async (req, res) => {
  try {
    const shop = req.shop || res.locals.shopify.session.shop;
    const config = await getStoreConfig(shop);
    res.json(config || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/store-config', async (req, res) => {
  try {
    const shop = req.shop || res.locals.shopify.session.shop;
    const result = await setStoreConfig(shop, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 27. Metafield Audit
router.post('/metafield-audit/preview', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const query = `
      query {
        products(first: 20) {
          edges {
            node {
              id
              title
              metafields(first: 5) {
                edges { node { namespace key value } }
              }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(session, query);
    const products = data.products.edges.map((e: any) => e.node).map((p: any) => ({
      id: p.id,
      current: p
    }));

    const previews = await previewChanges(products, (item) => {
      const hasAudit = item.current.metafields.edges.some((e: any) => e.node.namespace === 'teknik' && e.node.key === 'audit');
      if (!hasAudit) {
        return { metafields: [{ namespace: 'teknik', key: 'audit', type: 'single_line_text_field', value: 'Audited' }] };
      }
      return null;
    });

    res.json({ success: true, previews: previews.filter((p: any) => p.proposed !== null) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/metafield-audit/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation productUpdate($id: ID!, $metafields: [MetafieldInput!]!) {
        productUpdate(input: { id: $id, metafields: $metafields }) {
          product { id }
          userErrors { field message }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'MetafieldAudit');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 28. Boş Koleksiyon Dedektörü
router.post('/empty-collections/preview', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const query = `
      query {
        collections(first: 50) {
          edges {
            node {
              id
              title
              productsCount { count }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(session, query);
    const collections = data.collections.edges.map((e: any) => e.node).filter((c: any) => c.productsCount.count === 0).map((c: any) => ({
      id: c.id,
      current: c
    }));

    const previews = await previewChanges(collections, (item) => {
      return { delete: true };
    });

    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/empty-collections/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation collectionDelete($id: ID!) {
        collectionDelete(input: { id: $id }) {
          deletedCollectionId
          userErrors { field message }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'EmptyCollectionDetector');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 29. Redirect Yöneticisi
router.post('/redirects/preview', async (req, res) => {
  try {
    const { newRedirects } = req.body;
    const items = newRedirects.map((r: any, idx: number) => ({
      id: `new_redirect_${idx}`,
      current: null
    }));

    const previews = await previewChanges(items, (item) => {
      return newRedirects[parseInt(item.id.split('_')[2])];
    });

    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/redirects/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation urlRedirectCreate($path: String!, $target: String!) {
        urlRedirectCreate(urlRedirect: { path: $path, target: $target }) {
          urlRedirect { id }
          userErrors { field message }
        }
      }
    `;
    
    const approved = previews.filter((p: any) => p.approved);
    for (const item of approved) {
      await shopifyGQL(session, mutation, { path: item.proposed.path, target: item.proposed.target });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 30. GraphQL Test Aracı
router.post('/graphql-test/execute', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { query, variables } = req.body;
    
    const data = await shopifyGQL(session, query, variables || {});
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 31. Discount Kodu Üretici
router.post('/discount-generator/preview', async (req, res) => {
  try {
    const { codeCount, discountValue } = req.body;
    const items = Array.from({ length: codeCount || 1 }).map((_, idx) => ({
      id: `discount_${idx}`,
      current: null
    }));

    const previews = await previewChanges(items, (item) => {
      return { 
        code: `VWCLASSIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        value: discountValue
      };
    });

    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/discount-generator/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation priceRuleCreate($title: String!) {
        priceRuleCreate(priceRule: { title: $title, targetType: LINE_ITEM, targetSelection: ALL, allocationMethod: ACROSS, valueType: PERCENTAGE, value: "-10.0", customerSelection: { forAllCustomers: true }, startsAt: "2026-01-01T00:00:00Z" }) {
          priceRule { id }
          userErrors { field message }
        }
      }
    `;
    
    const approved = previews.filter((p: any) => p.approved);
    for (const item of approved) {
       await shopifyGQL(session, mutation, { title: item.proposed.code });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
