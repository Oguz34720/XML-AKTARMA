import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { prisma, shopify } from '../server.js';
import { shopifyGQL } from './shopifyClient.js';
import { getStoreConfig } from './encryption.js';

function normalizeRow(row: any) {
  // Replace ÖZ-İŞ with VW Classic Club
  if (row.MARKA === 'ÖZ-İŞ') {
    row.MARKA = 'VW Classic Club';
  }
  return row;
}

export async function runTicimaxSync(shop: string = 'vwcc-dev-store.myshopify.com') {
  console.log('[TicimaxSync] Starting daily synchronization...');
  
  const config = await getStoreConfig(shop);
  if (!config?.ticimaxFtpHost) {
    console.warn('[TicimaxSync] No ticimax config found for shop', shop);
    return;
  }

  // Assuming file is downloaded to this path via FTP script
  const filePath = process.env.TICIMAX_FILE_PATH || './ticimax-export.csv';
  
  if (!fs.existsSync(filePath)) {
    console.error('[TicimaxSync] File not found:', filePath);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Step 2: Parse CSV
  const records = parse(fileContent, {
    delimiter: '\t',
    bom: true,
    columns: true,
    skip_empty_lines: true
  });

  const summary = { created: 0, updated: 0, errors: 0, errorDetails: [] as string[] };
  
  // We need an offline session for background tasks
  const sessionId = shopify.api.session.getOfflineId(shop);
  const session = await shopify.config.sessionStorage.loadSession(sessionId);
  if (!session) {
    console.error('[TicimaxSync] No offline session found for', shop);
    return summary;
  }

  // Step 3: Sync each row
  for (const rawRow of records) {
    try {
      const row = normalizeRow(rawRow);
      const ticimaxId = row.ID || row.ticimax_id;
      
      // a) Find existing product by ticimax_id metafield
      const findQuery = `
        query {
          products(first: 1, query: "metafield:sidekick.ticimax_id:${ticimaxId}") {
            nodes {
              id
              variants(first: 1) {
                nodes {
                  id
                  inventoryItem { id }
                }
              }
            }
          }
        }
      `;
      
      const searchRes = await shopifyGQL(session, findQuery);
      const existingProduct = searchRes.products?.nodes?.[0];

      const midCodeHtml = `<p>MID Code: TREOZETOIST34755</p>`;
      const finalHtml = row.ACIKLAMA ? `${row.ACIKLAMA}<br/>${midCodeHtml}` : midCodeHtml;

      if (existingProduct) {
        // b) If EXISTS -> productUpdate
        const updateMut = `
          mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
              product { id }
              userErrors { message }
            }
          }
        `;
        const res = await shopifyGQL(session, updateMut, {
          input: {
            id: existingProduct.id,
            bodyHtml: finalHtml,
            status: row.DURUM === 'Aktif' ? 'ACTIVE' : 'DRAFT'
          }
        });

        if (res.productUpdate?.userErrors?.length) {
          throw new Error(res.productUpdate.userErrors[0].message);
        }

        // Adjust inventory
        const variant = existingProduct.variants.nodes[0];
        if (variant && row.STOK) {
          const invMut = `
            mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
              inventoryAdjustQuantities(input: $input) {
                userErrors { message }
              }
            }
          `;
          await shopifyGQL(session, invMut, {
            input: {
              reason: "correction",
              name: "available",
              changes: [{
                delta: parseInt(row.STOK),
                inventoryItemId: variant.inventoryItem.id,
                locationId: "gid://shopify/Location/1" // Note: Requires dynamic location ID in real app
              }]
            }
          });
        }
        
        summary.updated++;
      } else {
        // c) If NOT EXISTS -> productCreate
        const createMut = `
          mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
              product { id }
              userErrors { message }
            }
          }
        `;
        const res = await shopifyGQL(session, createMut, {
          input: {
            title: row.URUN_ADI,
            bodyHtml: finalHtml,
            vendor: row.MARKA,
            productType: row.KATEGORI,
            status: row.DURUM === 'Aktif' ? 'ACTIVE' : 'DRAFT',
            metafields: [
              {
                namespace: "sidekick",
                key: "ticimax_id",
                type: "single_line_text_field",
                value: ticimaxId.toString()
              }
            ]
          }
        });

        if (res.productCreate?.userErrors?.length) {
          throw new Error(res.productCreate.userErrors[0].message);
        }
        summary.created++;
      }

      // e) Log each action
      await prisma.auditLog.create({
        data: {
          shop,
          module: 'ticimax_sync',
          action: existingProduct ? 'update' : 'create',
          payload: JSON.stringify({ ticimaxId })
        }
      });
      
    } catch (e: any) {
      summary.errors++;
      summary.errorDetails.push(`Row ID ${(rawRow as any).ID}: ${e.message}`);
    }
  }

  console.log('[TicimaxSync] Summary:', summary);
  return summary;
}
