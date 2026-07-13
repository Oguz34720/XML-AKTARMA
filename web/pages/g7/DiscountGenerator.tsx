import React, { useState } from 'react';
import { Page, Layout, Card, Button, DataTable, Checkbox, Text, Banner, TextField } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function DiscountGenerator() {
  const { t } = useTranslation();
  
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [codeCount, setCodeCount] = useState('5');
  const [discountValue, setDiscountValue] = useState('10');

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/g7/discount-generator/preview', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeCount: parseInt(codeCount), discountValue })
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
      const res = await fetch('/api/g7/discount-generator/commit', {
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
    p.proposed?.code,
    p.proposed?.value + '%'
  ]);

  return (
    <Page title={t('g7.discountGenerator.title', 'Discount Kodu Üretici')}>
      <Layout>
        <Layout.Section>
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              {t('g7.discountGenerator.success', 'Discount codes generated successfully.')}
            </Banner>
          )}
          <Card>
            <div style={{ padding: '16px' }}>
              <Text as="p">{t('g7.discountGenerator.description', 'Generate multiple random discount codes.')}</Text>
              <br />
              <TextField type="number" label={t('g7.discountGenerator.count', 'Number of codes to generate')} value={codeCount} onChange={setCodeCount} autoComplete="off" />
              <div style={{ marginTop: '16px' }}>
                <TextField type="number" label={t('g7.discountGenerator.value', 'Discount Percentage (%)')} value={discountValue} onChange={setDiscountValue} autoComplete="off" />
              </div>
              <br />
              <Button onClick={handlePreview} loading={loading}>
                {t('g7.discountGenerator.preview', 'Preview Discount Codes')}
              </Button>
            </div>
          </Card>
        </Layout.Section>
        
        {previews.length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <Text as="h2" variant="headingMd">{t('g7.discountGenerator.previewResults', 'Preview Results (HITL Phase 1)')}</Text>
              </div>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={[
                  t('g7.approve', 'Approve'),
                  t('g7.discountGenerator.code', 'Code'),
                  t('g7.discountGenerator.discount', 'Discount')
                ]}
                rows={rows}
              />
              <div style={{ padding: '16px' }}>
                <Button variant="primary" loading={committing} onClick={handleCommit}>
                  {t('g7.discountGenerator.commit', 'Commit Approved Codes (Phase 2)')}
                </Button>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
