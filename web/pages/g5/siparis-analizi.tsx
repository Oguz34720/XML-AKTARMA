import React from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function SiparisAnalizi() {
  const { t } = useTranslation();

  const rows = [
    ['Ocak 2026', '1250', '₺450,000', '₺360'],
    ['Şubat 2026', '1100', '₺390,000', '₺354'],
    ['Mart 2026', '1400', '₺510,000', '₺364'],
  ];

  return (
    <Page title={t('g5.siparis_analizi.title', 'Sipariş Analizi')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.siparis_analizi.monthly_summary', 'Aylık Sipariş Özeti')}
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                headings={[
                  t('g5.siparis_analizi.month', 'Ay'),
                  t('g5.siparis_analizi.order_count', 'Sipariş Sayısı'),
                  t('g5.siparis_analizi.total_revenue', 'Toplam Ciro'),
                  t('g5.siparis_analizi.aov', 'Ort. Sepet Tutarı'),
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
