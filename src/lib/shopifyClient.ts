import { GraphqlClient } from "@shopify/shopify-api";

export async function shopifyGQL(session: any, query: string, variables = {}) {
  const client = new GraphqlClient({ session });
  const res = await client.query({ data: { query, variables } });
  
  const cost = (res as any).extensions?.cost;
  if (cost?.throttleStatus?.currentlyAvailable < 100) {
    await new Promise(r => setTimeout(r, 1000));
  }
  
  if ((res.body as any).errors) {
    throw new Error(JSON.stringify((res.body as any).errors));
  }
  return (res.body as any).data;
}
