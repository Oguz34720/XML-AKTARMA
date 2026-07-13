export function validateEnv() {
  const requiredEnvVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_APP_URL',
    'GEMINI_API_KEY',
    'DATABASE_URL'
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
