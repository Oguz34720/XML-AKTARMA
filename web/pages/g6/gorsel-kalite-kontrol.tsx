import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Button, Text, BlockStack, Banner, Checkbox } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function GorselKaliteKontrol() {
  const { t } = useTranslation();
  
  const [images, setImages] = useState<any[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'fetch' | 'preview' | 'commit'>('fetch');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/g6/images');
      const data = await res.json();
      setImages(data.files || []);
      setStage('fetch');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/g6/images/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: images.map(i => ({ id: i.id, current: i })) })
      });
      const data = await res.json();
      setPreviews(data.previews || []);
      setStage('preview');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = (id: string) => {
    setPreviews(prev => prev.map(p => p.id === id ? { ...p, approved: !p.approved } : p));
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      await fetch('/api/g6/images/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews })
      });
      await loadImages();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (stage === 'fetch') {
      const rows = images.map(i => [
        <img src={i.image?.url} alt="thumbnail" width="50" style={{ objectFit: 'cover' }} />,
        i.id,
        <Text as="span" tone="critical">{t('g6.missingAltText', 'Alt metin eksik')}</Text>
      ]);
      return (
        <DataTable
          columnContentTypes={['text', 'text', 'text']}
          headings={[t('g6.image', 'Görsel'), t('g6.id', 'ID'), t('g6.status', 'Durum')]}
          rows={rows}
        />
      );
    } else {
      const rows = previews.map(p => [
        <Checkbox label="" checked={p.approved} onChange={() => toggleApproval(p.id)} />,
        p.id,
        <Text as="span" tone="subdued">{t('g6.missingAltText', 'Eksik')}</Text>,
        <Text as="span" tone="success">{p.proposed.alt}</Text>
      ]);
      return (
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text']}
          headings={[
            t('g6.approve', 'Onayla'), 
            t('g6.id', 'ID'), 
            t('g6.original', 'Mevcut'), 
            t('g6.proposed', 'Önerilen (AI)')
          ]}
          rows={rows}
        />
      );
    }
  };

  return (
    <Page title={t('g6.gorselKaliteKontrol', '24. Görsel Kalite Kontrol')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('g6.imagesMissingAlt', 'Alt Metni Eksik Görseller')}
                </Text>
                
                {images.length === 0 && !loading && (
                  <Banner tone="success">
                    {t('g6.noMissingAltText', 'Tüm görsellerin alt metni mevcut.')}
                  </Banner>
                )}
                
                {images.length > 0 && renderTable()}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  {stage === 'fetch' && images.length > 0 && (
                    <Button onClick={handlePreview} loading={loading} variant="primary">
                      {t('g6.generateAltText', 'AI ile Alt Metin Üret (Önizleme)')}
                    </Button>
                  )}
                  {stage === 'preview' && (
                    <Button 
                      onClick={handleCommit} 
                      loading={loading} 
                      variant="primary" 
                      tone="success"
                      disabled={!previews.some(p => p.approved)}
                    >
                      {t('g6.commitChanges', 'Seçilenleri Shopify\'a Kaydet')}
                    </Button>
                  )}
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
