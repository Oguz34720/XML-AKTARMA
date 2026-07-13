import React from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function KatalogAnalizi() {
  const { t } = useTranslation();

  const rows = [
    ['Motor Parçaları', '1240', '14%'],
    ['Kaporta', '850', '9%'],
    ['İç Trim', '430', '5%'],
  ];

  return (
    <Page title={t('g5.katalog_analizi.title', 'Katalog Analizi')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.katalog_analizi.overview', 'Kategori Bazlı Genel Bakış')}
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric']}
                headings={[
                  t('g5.katalog_analizi.category', 'Kategori'),
                  t('g5.katalog_analizi.product_count', 'Ürün Sayısı'),
                  t('g5.katalog_analizi.conversion_rate', 'Dönüşüm Oranı'),
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
