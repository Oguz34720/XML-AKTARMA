import React, { useState, useCallback } from 'react';
import { Page, Card, Button, DataTable, Layout, Tabs, Text, BlockStack, TextField, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

// Reusable HITL Component
function HITLModule({ title, endpoint, defaultInput }: { title: string, endpoint: string, defaultInput: any }) {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [inputData, setInputData] = useState(JSON.stringify(defaultInput, null, 2));
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');
    try {
      const items = JSON.parse(inputData);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', items })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        // initialize approved = true for preview items
        setPreviews(data.previews.map((p: any) => ({ ...p, approved: true })));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred');
    }
    setLoading(false);
  };

  const handleCommit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', items: previews })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setPreviews([]);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred');
    }
    setLoading(false);
  };

  const rows = previews.map(p => [
    p.id,
    JSON.stringify(p.original),
    JSON.stringify(p.proposed),
    p.approved ? t('yes', 'Yes') : t('no', 'No')
  ]);

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">{title}</Text>
          <TextField
            label={t('input_data', 'Input Data (JSON)')}
            value={inputData}
            onChange={setInputData}
            multiline={4}
            autoComplete="off"
          />
          <Button onClick={handlePreview} loading={loading} variant="primary">
            {t('preview_changes', 'Preview Changes (Phase 1)')}
          </Button>
        </BlockStack>
      </Card>
      
      {errorMsg && (
        <Banner title={t('error', 'Error')} tone="critical" onDismiss={() => setErrorMsg('')}>
          <p>{errorMsg}</p>
        </Banner>
      )}

      {previews.length > 0 && (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingSm">{t('preview_table', 'Phase 2: Preview & Commit')}</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={[t('id', 'ID'), t('original', 'Original'), t('proposed', 'Proposed'), t('approved', 'Approved')]}
              rows={rows}
            />
            <Button onClick={handleCommit} loading={loading} variant="primary" tone="success">
              {t('commit_changes', 'Commit Approved Changes')}
            </Button>
          </BlockStack>
        </Card>
      )}

      {success && (
        <Banner title={t('success_title', 'Changes committed successfully!')} tone="success" onDismiss={() => setSuccess(false)} />
      )}
    </BlockStack>
  );
}

export default function G1UrunYonetimi() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    []
  );

  const tabs = [
    { id: 'pazaryeri', content: t('pazaryeri', 'Pazaryeri Durumu') },
    { id: 'urun-durum', content: t('urun_durum', 'Ürün Durumu') },
    { id: 'vendor', content: t('vendor', 'Vendor Güncelle') },
    { id: 'koleksiyon', content: t('koleksiyon', 'Koleksiyon Atama') },
    { id: 'seo', content: t('seo', 'SEO Optimizasyon') },
    { id: 'arsiv', content: t('arsiv', 'Arşiv Yöneticisi') },
    { id: 'yayin-kanali', content: t('yayin_kanali', 'Yayın Kanalı') }
  ];

  const renderTabContent = () => {
    switch (selected) {
      case 0:
        return <HITLModule title={t('pazaryeri_title', 'Pazaryeri Durumu')} endpoint="/api/g1/pazaryeri" defaultInput={[{ id: "gid://shopify/Product/1", current: { value: "true" } }]} />;
      case 1:
        return <HITLModule title={t('urun_durum_title', 'Ürün Durumu')} endpoint="/api/g1/urun-durum" defaultInput={[{ id: "gid://shopify/Product/1", current: { status: "ACTIVE" } }]} />;
      case 2:
        return <HITLModule title={t('vendor_title', 'Vendor Güncelle')} endpoint="/api/g1/vendor" defaultInput={[{ id: "gid://shopify/Product/1", current: { vendor: "öz-iş" } }]} />;
      case 3:
        return <HITLModule title={t('koleksiyon_title', 'Koleksiyon Atama')} endpoint="/api/g1/koleksiyon" defaultInput={[{ id: "gid://shopify/Product/1", current: { collectionId: "gid://shopify/Collection/1" } }]} />;
      case 4:
        return <HITLModule title={t('seo_title', 'SEO Optimizasyon (AI)')} endpoint="/api/g1/seo" defaultInput={[{ id: "gid://shopify/Product/1", current: { title: "VW Beetle Klasik Direksiyon", description: "Eski tip direksiyon" } }]} />;
      case 5:
        return <HITLModule title={t('arsiv_title', 'Arşiv Yöneticisi')} endpoint="/api/g1/arsiv" defaultInput={[{ id: "gid://shopify/Product/1", current: { status: "ACTIVE" } }]} />;
      case 6:
        return <HITLModule title={t('yayin_kanali_title', 'Yayın Kanalı Yöneticisi')} endpoint="/api/g1/yayin-kanali" defaultInput={[{ id: "gid://shopify/Product/1", current: { publicationId: "gid://shopify/Publication/1" } }]} />;
      default:
        return null;
    }
  };

  return (
    <Page title={t('g1_title', 'G1: Ürün Yönetimi')}>
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
              <div style={{ paddingTop: '16px' }}>
                {renderTabContent()}
              </div>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
