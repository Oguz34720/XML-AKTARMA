import { shopifyGQL } from './shopifyClient.js';

export async function startBulkQuery(session: any, query: string): Promise<string> {
  const mutation = `
    mutation {
      bulkOperationRunQuery(
        query: """${query}"""
      ) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const res = await shopifyGQL(session, mutation);
  if (res.bulkOperationRunQuery.userErrors.length > 0) {
    throw new Error(JSON.stringify(res.bulkOperationRunQuery.userErrors));
  }
  return res.bulkOperationRunQuery.bulkOperation.id;
}

export async function pollBulkOperation(session: any, id: string): Promise<string> {
  const query = `
    query {
      currentBulkOperation {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
  `;
  
  while (true) {
    const res = await shopifyGQL(session, query);
    const op = res.currentBulkOperation;
    if (op && op.id === id) {
      if (op.status === 'COMPLETED') {
        return op.url;
      }
      if (op.status === 'FAILED' || op.status === 'CANCELED') {
        throw new Error(`Bulk operation ${op.status}`);
      }
    }
    // Poll every 2 seconds
    await new Promise(r => setTimeout(r, 2000));
  }
}

export async function downloadBulkResults(url: string): Promise<any[]> {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.trim().split('\n');
  return lines.map(line => JSON.parse(line));
}
