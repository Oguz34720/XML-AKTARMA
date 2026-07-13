import React from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function MarkaPerformansi() {
  const { t } = useTranslation();

  const rows = [
    ['Bosch', '450', '₺125,000', '12%'],
    ['Hella', '320', '₺85,000', '15%'],
    ['Meyle', '210', '₺60,000', '10%'],
  ];

  return (
    <Page title={t('g5.marka_performansi.title', 'Marka Performansı')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.marka_performansi.overview', 'Marka Satış Raporu')}
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                headings={[
                  t('g5.marka_performansi.brand', 'Marka'),
                  t('g5.marka_performansi.sales_count', 'Satış Adedi'),
                  t('g5.marka_performansi.revenue', 'Ciro'),
                  t('g5.marka_performansi.growth', 'Büyüme (%)'),
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
