import React from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function IadeAnalizi() {
  const { t } = useTranslation();

  const rows = [
    ['Yanlış Parça Siparişi', '45', '40%'],
    ['Kusurlu/Hasarlı Ürün', '25', '22%'],
    ['Gecikmeli Teslimat', '15', '13%'],
    ['Diğer', '28', '25%'],
  ];

  return (
    <Page title={t('g5.iade_analizi.title', 'İade Analizi')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.iade_analizi.reasons', 'İade Nedenleri')}
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric']}
                headings={[
                  t('g5.iade_analizi.reason', 'Neden'),
                  t('g5.iade_analizi.count', 'İade Sayısı'),
                  t('g5.iade_analizi.percentage', 'Oran (%)'),
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
