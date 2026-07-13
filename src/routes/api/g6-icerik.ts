import { Router } from 'express';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { previewChanges, commitChanges } from '../../lib/hitl.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock_key' });

// ==========================================
// 24. Görsel Kalite Kontrol (Alt text)
// ==========================================
router.get('/images', async (req, res) => {
  try {
    const query = `
      query {
        files(first: 50, query: "media_type:IMAGE") {
          nodes {
            ... on MediaImage {
              id
              alt
              image {
                url
              }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(res.locals.shopify.session, query);
    const nodes = data.files?.nodes || [];
    // Only return images missing alt text
    const files = nodes.filter((f: any) => !f.alt || f.alt.trim() === '');
    res.json({ files });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/images/preview', async (req, res) => {
  try {
    const { items } = req.body;
    const previews = await previewChanges(items, (item) => {
      // Simulate AI generating alt text
      return { alt: `VW Classic Part - Auto Generated ${Math.floor(Math.random() * 1000)}` };
    });
    res.json({ previews });
  } catch (error: any) {
    console.error('Error in images preview:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/images/commit', async (req, res) => {
  try {
    const { previews } = req.body;
    const mutation = `
      mutation fileUpdateSingle($id: ID!, $alt: String!) {
        fileUpdate(files: [{id: $id, alt: $alt}]) {
          userErrors { message }
        }
      }
    `;
    await commitChanges(res.locals.shopify.session, previews, mutation, 'G6_IMAGES');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in images commit:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 25. Dosya Yöneticisi (Orphan Cleanup)
// ==========================================
router.get('/files/orphans', async (req, res) => {
  try {
    const query = `
      query {
        files(first: 50) {
          nodes {
            ... on GenericFile {
              id
              url
              createdAt
            }
            ... on MediaImage {
              id
              image { url }
              createdAt
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(res.locals.shopify.session, query);
    // In a real app we'd verify usage. For demo, we return all or some simulated orphans.
    const files = data.files?.nodes || [];
    res.json({ files });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/files/preview', async (req, res) => {
  try {
    const { items } = req.body;
    const previews = await previewChanges(items, (item) => {
      return { action: 'delete' }; // Just for logging/display
    });
    res.json({ previews });
  } catch (error: any) {
    console.error('Error in files preview:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/files/commit', async (req, res) => {
  try {
    const { previews } = req.body;
    const mutation = `
      mutation fileDeleteSingle($id: ID!) {
        fileDelete(fileIds: [$id]) {
          deletedFileIds
          userErrors { message }
        }
      }
    `;
    await commitChanges(res.locals.shopify.session, previews, mutation, 'G6_FILES');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error in files commit:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 26. Çeviri Durumu (Check translatableResources)
// ==========================================
router.get('/translations', async (req, res) => {
  try {
    const query = `
      query {
        translatableResources(first: 50, resourceType: PRODUCT) {
          edges {
            node {
              resourceId
              translatableContent {
                key
                value
                digest
              }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(res.locals.shopify.session, query);
    const resources = data.translatableResources?.edges.map((e: any) => e.node) || [];
    res.json({ resources });
  } catch (error: any) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
