import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Button, Text, BlockStack, Banner, Checkbox } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function DosyaYoneticisi() {
  const { t } = useTranslation();
  
  const [files, setFiles] = useState<any[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'fetch' | 'preview' | 'commit'>('fetch');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/g6/files/orphans');
      const data = await res.json();
      setFiles(data.files || []);
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
      const res = await fetch('/api/g6/files/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: files.map(f => ({ id: f.id, current: f })) })
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
      await fetch('/api/g6/files/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews })
      });
      await loadFiles();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (stage === 'fetch') {
      const rows = files.map(f => [
        <Text as="span" variant="bodyMd">{f.id}</Text>,
        <a href={f.url || f.image?.url} target="_blank" rel="noreferrer">
          {t('g6.viewFile', 'Dosyayı Gör')}
        </a>,
        new Date(f.createdAt).toLocaleDateString()
      ]);
      return (
        <DataTable
          columnContentTypes={['text', 'text', 'text']}
          headings={[t('g6.id', 'ID'), t('g6.link', 'Bağlantı'), t('g6.createdAt', 'Oluşturulma Tarihi')]}
          rows={rows}
        />
      );
    } else {
      const rows = previews.map(p => [
        <Checkbox label="" checked={p.approved} onChange={() => toggleApproval(p.id)} />,
        p.id,
        <Text as="span" tone="critical">{t('g6.markForDeletion', 'Silinecek')}</Text>
      ]);
      return (
        <DataTable
          columnContentTypes={['text', 'text', 'text']}
          headings={[
            t('g6.approve', 'Onayla'), 
            t('g6.id', 'ID'), 
            t('g6.action', 'İşlem')
          ]}
          rows={rows}
        />
      );
    }
  };

  return (
    <Page title={t('g6.dosyaYoneticisi', '25. Dosya Yöneticisi')}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('g6.orphanFiles', 'Kullanılmayan (Orphan) Dosyalar')}
                </Text>
                
                {files.length === 0 && !loading && (
                  <Banner tone="success">
                    {t('g6.noOrphanFiles', 'Temizlenecek dosya bulunamadı.')}
                  </Banner>
                )}
                
                {files.length > 0 && renderTable()}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  {stage === 'fetch' && files.length > 0 && (
                    <Button onClick={handlePreview} loading={loading} variant="primary">
                      {t('g6.previewCleanup', 'Temizliği Önizle')}
                    </Button>
                  )}
                  {stage === 'preview' && (
                    <Button 
                      onClick={handleCommit} 
                      loading={loading} 
                      variant="primary" 
                      tone="critical"
                      disabled={!previews.some(p => p.approved)}
                    >
                      {t('g6.commitCleanup', 'Seçilenleri Sil')}
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
