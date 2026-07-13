import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Badge, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function CeviriDurumu() {
  const { t } = useTranslation();
  
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/g6/translations');
      const data = await res.json();
      setResources(data.resources || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    const rows = resources.map(r => {
      // translatableContent is an array of { key, value, digest }
      const content = r.translatableContent || [];
      const hasContent = content.length > 0;
      
      return [
        <Text as="span" variant="bodyMd">{r.resourceId}</Text>,
        <Text as="span" variant="bodyMd">{hasContent ? content.length : 0}</Text>,
        hasContent ? <Badge tone="success">{t('g6.translated', 'Çevrildi')}</Badge> : <Badge tone="warning">{t('g6.pending', 'Bekliyor')}</Badge>
      ];
    });

    return (
      <DataTable
        columnContentTypes={['text', 'numeric', 'text']}
        headings={[t('g6.resourceId', 'Kaynak ID'), t('g6.fieldsCount', 'Alan Sayısı'), t('g6.status', 'Durum')]}
        rows={rows}
      />
    );
  };

  return (
    <Page title={t('g6.ceviriDurumu', '26. Çeviri Durumu')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('g6.translatableResources', 'Çevrilebilir İçerikler')}
                </Text>
                
                {resources.length === 0 && !loading && (
                  <Banner tone="info">
                    {t('g6.noResources', 'Çevrilebilir kaynak bulunamadı.')}
                  </Banner>
                )}
                
                {resources.length > 0 && renderTable()}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
