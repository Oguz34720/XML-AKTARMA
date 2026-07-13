import express from 'express';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { previewChanges, commitChanges } from '../../lib/hitl.js';

const router = express.Router();

// ------------------------------------------------------------------
// Module 15: OEM Matrix
// ------------------------------------------------------------------
router.post('/oem-matrix/preview', async (req, res) => {
  try {
    const { products } = req.body;
    
    const previews = await previewChanges(products, (item) => {
      const oemRegex = /OEM:\s*([a-zA-Z0-9_-]+)/gi;
      const matches = [...(item.descriptionHtml || '').matchAll(oemRegex)];
      let newTags = [...(item.tags || [])];
      matches.forEach(m => {
        const oem = m[1];
        if (!newTags.includes(`OEM:${oem}`)) {
          newTags.push(`OEM:${oem}`);
        }
      });
      return { tags: newTags };
    });
    
    res.json({ previews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/oem-matrix/commit', async (req, res) => {
  try {
    const { session } = res.locals.shopify;
    const { previews } = req.body;
    
    const mutation = `
      mutation productUpdate($id: ID!, $tags: [String!]) {
        productUpdate(input: { id: $id, tags: $tags }) {
          product { id tags }
          userErrors { field message }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'G4_OEM_MATRIX');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------
// Module 16: Araç Uyumluluk (Fitment) Yöneticisi
// ------------------------------------------------------------------
router.post('/fitment/preview', async (req, res) => {
  try {
    const { products } = req.body; 
    
    const previews = await previewChanges(products, (item) => {
      return { 
        metafields: [
          {
            namespace: "sidekick",
            key: "fitment",
            type: "json",
            value: JSON.stringify(item.fitments || [])
          }
        ] 
      };
    });
    
    res.json({ previews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fitment/commit', async (req, res) => {
  try {
    const { session } = res.locals.shopify;
    const { previews } = req.body;
    
    const mutation = `
      mutation productUpdateMetafields($id: ID!, $metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }
    `;
    
    // In hitl, id is passed. However, metafieldsSet expects OwnerId inside the metafield input.
    // So we need to map id into the metafield object before commit, or we can use productUpdate to set metafields.
    const productUpdateMutation = `
      mutation productUpdate($id: ID!, $metafields: [MetafieldInput!]) {
        productUpdate(input: { id: $id, metafields: $metafields }) {
          product { id }
          userErrors { field message }
        }
      }
    `;
    
    await commitChanges(session, previews, productUpdateMutation, 'G4_FITMENT');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------
// Module 17: Parça Kategorisi Eşleştirici
// ------------------------------------------------------------------
router.post('/category/preview', async (req, res) => {
  try {
    const { products, categoryMapping } = req.body; 
    // categoryMapping: { [breadcrumb: string]: collectionId }
    
    const previews = await previewChanges(products, (item) => {
      const collectionId = categoryMapping[item.breadcrumbkat];
      return { collectionId }; // proposed
    });
    
    res.json({ previews });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/category/commit', async (req, res) => {
  try {
    const { session } = res.locals.shopify;
    const { previews } = req.body;
    
    // The collectionId is in proposed.collectionId
    // id is product ID.
    const mutation = `
      mutation addProductToCollection($id: ID!, $collectionId: ID!) {
        collectionAddProducts(id: $collectionId, productIds: [$id]) {
          collection { id }
          userErrors { field message }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'G4_CATEGORY');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
