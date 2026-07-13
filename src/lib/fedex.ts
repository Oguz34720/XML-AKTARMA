import { getCached } from './cache.js';

const FEDEX_API_BASE = process.env.FEDEX_SANDBOX === 'true' 
  ? 'https://apis-sandbox.fedex.com' 
  : 'https://api.fedex.com';

async function getFedexToken(): Promise<string> {
  // Use a generic shop string for global api caching
  return getCached('global_system', 'fedex_token', 3500, async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.FEDEX_CLIENT_ID!);
    params.append('client_secret', process.env.FEDEX_CLIENT_SECRET!);

    const res = await fetch(`${FEDEX_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    if (!res.ok) {
      throw new Error(`FedEx OAuth failed: ${await res.text()}`);
    }
    
    const data = await res.json();
    return data.access_token;
  });
}

export async function getFedexRates({
  weightGrams,
  length,
  width,
  height,
  originCountry,
  destCountry,
  tareType,
  tareValue
}: {
  weightGrams: number,
  length: number,
  width: number,
  height: number,
  originCountry: string,
  destCountry: string,
  tareType: 'fixed' | 'percentage',
  tareValue: number
}) {
  const token = await getFedexToken();
  
  // Calculate final weight in KG
  let finalWeightKg = 0;
  if (tareType === 'fixed') {
    finalWeightKg = (weightGrams + tareValue) / 1000;
  } else {
    finalWeightKg = (weightGrams * (1 + tareValue / 100)) / 1000;
  }
  
  // Round up to nearest 0.5 KG for FedEx standards
  finalWeightKg = Math.ceil(finalWeightKg * 2) / 2;

  const payload = {
    accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER! },
    requestedShipment: {
      shipper: { address: { countryCode: originCountry } },
      recipient: { address: { countryCode: destCountry } },
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      requestedPackageLineItems: [{
        weight: { units: "KG", value: finalWeightKg },
        dimensions: { length, width, height, units: "CM" }
      }]
    }
  };

  const res = await fetch(`${FEDEX_API_BASE}/rate/v1/rates/quotes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`FedEx Rate Error: ${await res.text()}`);
  }

  const data = await res.json();
  
  // Parse output to return simple options
  const options = data.output?.rateReplyDetails?.map((detail: any) => {
    const rate = detail.ratedShipmentDetails[0]?.totalNetCharge;
    return {
      serviceType: detail.serviceType,
      transitDays: detail.commit?.daysInTransit || 'N/A',
      price: rate || 0,
      currency: detail.ratedShipmentDetails[0]?.currency || 'USD'
    };
  }) || [];

  return options.sort((a: any, b: any) => a.price - b.price);
}
