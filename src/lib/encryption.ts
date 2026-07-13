import crypto from 'crypto';
import { prisma } from '../server.js';

const ALGORITHM = 'aes-256-gcm';

// The encryption key must be 32 bytes (256 bits). 
// Falls back to a deterministic 32-byte key for development if none provided.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
  : crypto.scryptSync('vw-classic-erp-secret', 'salt', 32);

export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 3) return text; // Probably not encrypted
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function getStoreConfig(shop: string) {
  const config = await prisma.storeConfig.findUnique({ where: { shop } });
  if (!config) return null;
  
  return {
    ...config,
    ticimaxFtpPass: config.ticimaxFtpPass ? decrypt(config.ticimaxFtpPass) : null,
    fedexSecret: config.fedexSecret ? decrypt(config.fedexSecret) : null
  };
}

export async function setStoreConfig(shop: string, data: any) {
  const payload: any = { ...data };
  
  if (payload.ticimaxFtpPass) {
    payload.ticimaxFtpPass = encrypt(payload.ticimaxFtpPass);
  }
  if (payload.fedexSecret) {
    payload.fedexSecret = encrypt(payload.fedexSecret);
  }

  return prisma.storeConfig.upsert({
    where: { shop },
    update: payload,
    create: { shop, ...payload }
  });
}
