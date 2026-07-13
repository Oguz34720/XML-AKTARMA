import { prisma } from '../server.js';

export async function getCached<T>(
  shop: string,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await prisma.cache.findUnique({ where: { shop_key: { shop, key } } });
  
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return JSON.parse(cached.value) as T;
  }
  
  const fresh = await fetcher();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  
  await prisma.cache.upsert({
    where: { shop_key: { shop, key } },
    update: { value: JSON.stringify(fresh), expiresAt },
    create: { shop, key, value: JSON.stringify(fresh), expiresAt }
  });
  
  return fresh;
}
