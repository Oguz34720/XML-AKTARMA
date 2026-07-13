import React, { useState } from 'react';
import { Page, Layout, Card, Button, DataTable, Checkbox, Text, Banner, TextField } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function RedirectManager() {
  const { t } = useTranslation();
  
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [path, setPath] = useState('');
  const [target, setTarget] = useState('');

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/g7/redirects/preview', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRedirects: [{ path, target }] })
      });
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
      const res = await fetch('/api/g7/redirects/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setPreviews([]);
        setPath('');
        setTarget('');
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
    p.proposed?.path,
    p.proposed?.target
  ]);

  return (
    <Page title={t('g7.redirectManager.title', 'Redirect Yöneticisi')}>
      <Layout>
        <Layout.Section>
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              {t('g7.redirectManager.success', 'Redirects created successfully.')}
            </Banner>
          )}
          <Card>
            <div style={{ padding: '16px' }}>
              <Text as="p">{t('g7.redirectManager.description', 'Manage URL redirects.')}</Text>
              <br />
              <TextField label={t('g7.redirectManager.path', 'Path (e.g. /old-url)')} value={path} onChange={setPath} autoComplete="off" />
              <div style={{ marginTop: '16px' }}>
                <TextField label={t('g7.redirectManager.target', 'Target (e.g. /new-url)')} value={target} onChange={setTarget} autoComplete="off" />
              </div>
              <br />
              <Button onClick={handlePreview} loading={loading}>
                {t('g7.redirectManager.preview', 'Preview Redirect Creation')}
              </Button>
            </div>
          </Card>
        </Layout.Section>
        
        {previews.length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <Text as="h2" variant="headingMd">{t('g7.redirectManager.previewResults', 'Preview Results (HITL Phase 1)')}</Text>
              </div>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={[
                  t('g7.approve', 'Approve'),
                  t('g7.redirectManager.path', 'Path'),
                  t('g7.redirectManager.target', 'Target')
                ]}
                rows={rows}
              />
              <div style={{ padding: '16px' }}>
                <Button variant="primary" loading={committing} onClick={handleCommit}>
                  {t('g7.redirectManager.commit', 'Commit Approved Redirects (Phase 2)')}
                </Button>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
