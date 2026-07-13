import { PrismaClient } from '@prisma/client';
import { shopifyGQL } from './shopifyClient.js';

const prisma = new PrismaClient();

// Phase 1: Preview — sadece hesapla, kaydetme
export async function previewChanges(items: any[], computeChange: (item: any) => any) {
  return items.map(item => ({
    id: item.id,
    original: item.current,
    proposed: computeChange(item),
    approved: false  // kullanıcı işaretleyecek
  }));
}

// Phase 2: Commit — sadece approved=true olanları gönder
export async function commitChanges(session: any, previews: any[], mutation: string, module: string) {
  const approved = previews.filter(p => p.approved);
  for (const item of approved) {
    // Save snapshot
    await prisma.snapshot.create({
      data: {
        shop: session.shop,
        productId: item.id,
        module,
        data: JSON.stringify(item.original)
      }
    });

    // Execute mutation
    await shopifyGQL(session, mutation, { id: item.id, ...item.proposed });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        shop: session.shop,
        module,
        action: 'commit',
        payload: JSON.stringify({ id: item.id, proposed: item.proposed })
      }
    });
  }
}
