import { Router } from 'express';
import { shopifyGQL } from '../../lib/shopifyClient.js';
import { previewChanges, commitChanges } from '../../lib/hitl.js';

const router = Router();

// 8. Stok Uyarı Sistemi (Read-only report)
router.get('/uyari', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    // Get variants with low inventory (e.g., less than or equal to 5)
    const query = `
      {
        productVariants(first: 50, query: "inventory_quantity:<=5") {
          edges {
            node {
              id
              title
              inventoryQuantity
              inventoryItem {
                id
              }
              product {
                title
              }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(session, query);
    res.json({ success: true, data: data.productVariants.edges.map((e: any) => e.node) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Stok Transfer Preview
router.post('/transfer/preview', async (req, res) => {
  try {
    const { items, fromLocationId, toLocationId } = req.body;
    // items: [{ id: "gid://shopify/InventoryItem/...", quantity: 2, current: {...} }]
    const previews = await previewChanges(items, (item) => ({
      quantity: item.quantity,
      fromLocationId,
      toLocationId
    }));
    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Stok Transfer Commit
router.post('/transfer/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation inventoryMoveQuantities($id: ID!, $quantity: Int!, $fromLocationId: ID!, $toLocationId: ID!) {
        inventoryMoveQuantities(
          input: {
            inventoryItemId: $id
            quantity: $quantity
            fromLocationId: $fromLocationId
            toLocationId: $toLocationId
          }
        ) {
          inventoryAdjustmentGroup {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'stok-transfer');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Fiyat Anomali Dedektörü (Preview)
router.post('/anomali/preview', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    // Fetch variants to check for anomalies (e.g. price is 0 or extremely low compared to compareAtPrice)
    const query = `
      {
        productVariants(first: 50) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              product {
                title
              }
            }
          }
        }
      }
    `;
    const data = await shopifyGQL(session, query);
    const variants = data.productVariants.edges.map((e: any) => e.node);
    
    // Anomaly detection logic: if price is 0, or compareAtPrice > price * 3
    const anomalies = variants.filter((v: any) => {
      const price = parseFloat(v.price) || 0;
      const compare = parseFloat(v.compareAtPrice) || 0;
      return price === 0 || (compare > 0 && compare > price * 3);
    });

    const itemsForPreview = anomalies.map((v: any) => ({
      id: v.id,
      current: v,
      // Propose a corrected price (e.g., 80% of compareAtPrice if available, else 100)
      suggestedPrice: v.compareAtPrice ? (parseFloat(v.compareAtPrice) * 0.8).toFixed(2) : "100.00"
    }));

    const previews = await previewChanges(itemsForPreview, (item) => ({
      price: item.suggestedPrice
    }));
    
    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Fiyat Anomali Dedektörü (Commit)
router.post('/anomali/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    const mutation = `
      mutation productVariantUpdate($id: ID!, $price: Money!) {
        productVariantUpdate(input: { id: $id, price: $price }) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'fiyat-anomali');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Lokalizasyon Fiyat Yöneticisi (Preview)
router.post('/lokalizasyon/preview', async (req, res) => {
  try {
    const { items, priceListId } = req.body;
    // items: [{ id: "gid://shopify/ProductVariant/...", price: "120.00", current: {...} }]
    const previews = await previewChanges(items, (item) => ({
      priceListId,
      price: item.price
    }));
    res.json({ success: true, previews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Lokalizasyon Fiyat Yöneticisi (Commit)
router.post('/lokalizasyon/commit', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { previews } = req.body;
    
    // We assume default currency code "TRY" for localization or we can pass it from frontend
    const mutation = `
      mutation priceListFixedPricesAdd($id: ID!, $priceListId: ID!, $price: Decimal!) {
        priceListFixedPricesAdd(
          priceListId: $priceListId,
          prices: [
            {
              variantId: $id,
              price: { amount: $price, currencyCode: TRY }
            }
          ]
        ) {
          pricesAdded
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    await commitChanges(session, previews, mutation, 'fiyat-lokalizasyon');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
