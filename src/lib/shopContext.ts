import { Request, Response, NextFunction } from 'express';

// Extend Express Request to hold shop data
declare global {
  namespace Express {
    interface Request {
      shop?: string;
    }
  }
}

export function shopContext(req: Request, res: Response, next: NextFunction) {
  // Extract shop from header or query
  const shop = req.header('x-shopify-shop-domain') || req.query.shop as string;
  
  if (!shop) {
    // If not in standard Shopify fields, try res.locals from Shopify App Express
    if (res.locals?.shopify?.session?.shop) {
      req.shop = res.locals.shopify.session.shop;
      return next();
    }
    
    // Some routes might not need it strictly, but we log a warning
    console.warn('[ShopContext] Missing shop domain in request');
    return next();
  }
  
  req.shop = shop;
  next();
}
