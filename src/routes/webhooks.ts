import { Router } from 'express';
import { prisma } from '../server.js';
import { validateWebhookHmac } from '../lib/secretRotation.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const hmac = req.header('x-shopify-hmac-sha256');
    const topic = req.header('x-shopify-topic');
    const shop = req.header('x-shopify-shop-domain');
    
    if (!hmac || !topic || !shop) {
      return res.status(400).send('Missing headers');
    }
    
    // We need rawBody for HMAC validation. Ensure Express is passing it.
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    if (!validateWebhookHmac(rawBody, hmac)) {
      return res.status(401).send('Unauthorized webhook');
    }
    
    const payload = req.body;
    
    switch (topic) {
      case 'products/update':
        await prisma.$executeRaw`DELETE FROM Cache WHERE key LIKE ${'product_' + payload.id + '%'}`;
        await prisma.auditLog.create({
          data: {
            shop,
            module: 'webhook',
            action: 'product_updated',
            payload: JSON.stringify({ id: payload.id })
          }
        });
        break;
        
      case 'orders/create':
        await prisma.orderCache.upsert({
          where: { orderId: payload.id.toString() },
          update: {
            totalPrice: payload.total_price,
            lineItems: JSON.stringify(payload.line_items)
          },
          create: {
            orderId: payload.id.toString(),
            shop,
            totalPrice: payload.total_price,
            lineItems: JSON.stringify(payload.line_items),
            createdAt: new Date(payload.created_at)
          }
        });
        break;
        
      case 'app/uninstalled':
        await prisma.auditLog.create({
          data: { shop, module: 'webhook', action: 'app_uninstalled', payload: '{}' }
        });
        await prisma.auditLog.deleteMany({ where: { shop } });
        await prisma.snapshot.deleteMany({ where: { shop } });
        await prisma.cache.deleteMany({ where: { shop } });
        await prisma.orderCache.deleteMany({ where: { shop } });
        break;
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
