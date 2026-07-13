import { shopifyGQL } from './shopifyClient.js';

export async function fetchAllPages<T>(
  session: any,
  query: string,
  dataPath: string,
  variables: Record<string, any> = {}
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;
  let hasNext = true;
  
  while (hasNext) {
    const data = await shopifyGQL(session, query, { ...variables, after: cursor, first: 250 });
    
    // e.g., dataPath = "products" -> data.products
    const conn = dataPath.split('.').reduce((o, k) => o[k], data);
    
    if (!conn || !conn.nodes) break;
    
    results.push(...conn.nodes);
    hasNext = conn.pageInfo?.hasNextPage || false;
    cursor = conn.pageInfo?.endCursor || null;
  }
  
  return results;
}
