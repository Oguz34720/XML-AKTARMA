import crypto from 'crypto';

export function validateWebhookHmac(rawBody: string | Buffer, hmacHeader: string): boolean {
  if (!process.env.SHOPIFY_API_SECRET) {
    throw new Error('SHOPIFY_API_SECRET is missing');
  }

  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(rawBody as string | Buffer)
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmacHeader));
}
