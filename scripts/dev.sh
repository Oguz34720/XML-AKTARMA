#!/bin/bash
echo "=========================================="
echo "   VW Classic Club ERP - Dev Server"
echo "=========================================="
echo ""
echo "Eğer ngrok kullanıyorsanız, ngrok URL'nizi buraya yapıştırın."
echo "(Örn: https://abcd.ngrok-free.app)"
echo "Eğer Cloudflare kullanmak istiyorsanız ENTER'a basıp boş geçebilirsiniz."
echo ""
read -p "Ngrok URL (Opsiyonel): " NGROK_URL

if [ -z "$NGROK_URL" ]
then
  echo "Cloudflare tüneli kullanılarak başlatılıyor..."
  npx @shopify/cli@latest app dev
else
  echo "Ngrok tüneli ($NGROK_URL) kullanılarak başlatılıyor..."
  npx @shopify/cli@latest app dev --tunnel-url=$NGROK_URL
fi
