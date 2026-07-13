import React, { useState } from 'react';
import { Page, Layout, Card, Button, DataTable, Checkbox, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function EmptyCollectionDetector() {
  const { t } = useTranslation();
  
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/g7/empty-collections/preview', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPreviews(data.previews);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await fetch('/api/g7/empty-collections/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setPreviews([]);
      }
    } catch (err) {
      console.error(err);
    }
    setCommitting(false);
  };

  const toggleApprove = (index: number) => {
    const newPreviews = [...previews];
    newPreviews[index].approved = !newPreviews[index].approved;
    setPreviews(newPreviews);
  };

  const rows = previews.map((p, index) => [
    <Checkbox checked={p.approved} onChange={() => toggleApprove(index)} label="" />,
    p.id,
    p.original?.title || t('unknown'),
    t('g7.emptyCollection.deleteAction', 'Delete Collection')
  ]);

  return (
    <Page title={t('g7.emptyCollection.title', 'Boş Koleksiyon Dedektörü')}>
      <Layout>
        <Layout.Section>
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              {t('g7.emptyCollection.success', 'Empty collections deleted successfully.')}
            </Banner>
          )}
          <Card>
            <div style={{ padding: '16px' }}>
              <Text as="p">{t('g7.emptyCollection.description', 'Find and remove collections with 0 products.')}</Text>
              <br />
              <Button onClick={handlePreview} loading={loading}>
                {t('g7.emptyCollection.preview', 'Scan for Empty Collections')}
              </Button>
            </div>
          </Card>
        </Layout.Section>
        
        {previews.length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <Text as="h2" variant="headingMd">{t('g7.emptyCollection.previewResults', 'Preview Results (HITL Phase 1)')}</Text>
              </div>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={[
                  t('g7.approve', 'Approve'),
                  t('g7.id', 'ID'),
                  t('g7.title', 'Title'),
                  t('g7.proposed', 'Action')
                ]}
                rows={rows}
              />
              <div style={{ padding: '16px' }}>
                <Button variant="primary" loading={committing} onClick={handleCommit}>
                  {t('g7.emptyCollection.commit', 'Commit Deletions (Phase 2)')}
                </Button>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
