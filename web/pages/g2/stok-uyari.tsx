import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Spinner, Badge } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function StokUyari() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/g2/uyari')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const rows = data.map((item) => [
    item.product?.title || '-',
    item.title,
    <Badge tone={item.inventoryQuantity === 0 ? "critical" : "warning"}>
      {item.inventoryQuantity}
    </Badge>
  ]);

  return (
    <Page title={t('g2.stokUyari.title', 'Stok Uyarı Sistemi')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g2.stokUyari.subtitle', 'Düşük Stoklu Ürünler')}
              </Text>
              {loading ? (
                <Spinner />
              ) : rows.length === 0 ? (
                <Text as="p">{t('g2.stokUyari.noData', 'Tüm ürünlerin stok durumu iyi.')}</Text>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric']}
                  headings={[
                    t('g2.stokUyari.product', 'Ürün Adı'),
                    t('g2.stokUyari.variant', 'Varyant'),
                    t('g2.stokUyari.quantity', 'Stok Miktarı')
                  ]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
