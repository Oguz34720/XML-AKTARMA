// ============================================================
// src/server.ts
// Express + Shopify App entrypoint
// ============================================================

import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyApp } from '@shopify/shopify-app-express';
import { LATEST_API_VERSION } from '@shopify/shopify-api';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import { validateEnv } from './lib/validateEnv.js';
import healthRouter from './routes/health.js';
import webhooksRouter from './routes/webhooks.js';
import { initScheduler } from './lib/scheduler.js';

// API Routes
import g1Router from './routes/api/g1-urun.js';
import g2Router from './routes/api/g2-stok.js';
import g3Router from './routes/api/g3-kargo.js';
import g4Router from './routes/api/g4-vw.js';
import g5Router from './routes/api/g5-analitik.js';
import g6Router from './routes/api/g6-icerik.js';
import g6ImageProcessorRouter from './routes/api/g6-image-processor.js';
import g7Router from './routes/api/g7-teknik.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Env Validation ───────────────────────────────────────────
validateEnv();

// ── Prisma Client ────────────────────────────────────────────
export const prisma = new PrismaClient();

// ── Shopify App ──────────────────────────────────────────────
export const shopify = shopifyApp({
  api: {
    apiKey:    process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes:    process.env.SCOPES!.split(','),
    hostName:  (process.env.HOST || process.env.SHOPIFY_APP_URL || '').replace(/https?:\/\//, ''),
    apiVersion: LATEST_API_VERSION as any,
  },
  auth: {
    path:         '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  // @ts-ignore - Peer dependency mismatch between @shopify/shopify-api versions
  sessionStorage: new PrismaSessionStorage(prisma),
});

// Register webhooks after auth
shopify.config.webhooks.path = '/api/webhooks';

// ── Express App ──────────────────────────────────────────────
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

app.use(cors({ origin: '*' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/health', healthRouter);

app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify.session;
      await shopify.api.webhooks.register({ session });
      console.log(`[Webhooks] Registered for ${session.shop}`);
      next();
    } catch (e) {
      next(e);
    }
  },
  shopify.redirectToShopifyOrAppRoot()
);

// Save raw body for HMAC validation
app.use(express.json({ 
  limit: '50mb',
  verify: (req: any, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/webhooks', webhooksRouter);
app.use('/api/*', shopify.validateAuthenticatedSession());
app.use('/api/g1', g1Router);
app.use('/api/g2', g2Router);
app.use('/api/g3', g3Router);
app.use('/api/g4', g4Router);
app.use('/api/g5', g5Router);
app.use('/api/g6', g6Router);
app.use('/api/image-processor', g6ImageProcessorRouter);
app.use('/api/g7', g7Router);

const clientDir = path.join(__dirname, '..', 'web');
const clientDistPath = path.join(clientDir, 'dist');

if (process.env.NODE_ENV === 'development') {
  console.log('[Server] Starting Vite in middleware mode...');
  try {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      root: clientDir,
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(viteServer.middlewares);
    
    app.use('*', shopify.ensureInstalledOnShop(), async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexHtml = path.join(clientDir, 'index.html');
        let template = await import('fs/promises').then(fs => fs.readFile(indexHtml, 'utf-8'));
        template = await viteServer.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        viteServer.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (err) {
    console.error('[Server] Vite middleware failed to start:', err);
  }
} else {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`[Server] Running on port ${PORT}`);
  
  // Initialize scheduled cron jobs
  initScheduler();
});
