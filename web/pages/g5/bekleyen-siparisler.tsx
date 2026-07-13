import React from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Badge } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function BekleyenSiparisler() {
  const { t } = useTranslation();

  const rows = [
    ['#1024', 'Ahmet Yılmaz', '₺1,250', <Badge tone="warning">Hazırlanıyor</Badge>, '2 Gün'],
    ['#1025', 'Mehmet Kaya', '₺850', <Badge tone="warning">Parça Bekliyor</Badge>, '4 Gün'],
    ['#1026', 'Ayşe Demir', '₺3,400', <Badge tone="critical">Ödeme Bekliyor</Badge>, '5 Gün'],
  ];

  return (
    <Page title={t('g5.bekleyen_siparisler.title', 'Bekleyen Siparişler')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.bekleyen_siparisler.list', 'Bekleyen Sipariş Listesi')}
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'text', 'text']}
                headings={[
                  t('g5.bekleyen_siparisler.order_id', 'Sipariş No'),
                  t('g5.bekleyen_siparisler.customer', 'Müşteri'),
                  t('g5.bekleyen_siparisler.amount', 'Tutar'),
                  t('g5.bekleyen_siparisler.status', 'Durum'),
                  t('g5.bekleyen_siparisler.wait_time', 'Bekleme Süresi'),
                ]}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
