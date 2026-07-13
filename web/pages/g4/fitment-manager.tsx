import { useState } from 'react';
import { Page, Layout, Card, Button, DataTable, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function FitmentManager() {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  
  // Example dummy data
  const dummyProducts = [
    { 
      id: "gid://shopify/Product/1", 
      fitments: [
        { make: "VW", model: "Golf", year: "1998-2004" },
        { make: "VW", model: "Bora", year: "1999-2005" }
      ]
    },
  ];

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const response = await fetch('/api/g4/fitment/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: dummyProducts }),
      });
      const data = await response.json();
      if (data.previews) {
        setPreviews(data.previews.map((p: any) => ({ ...p, approved: true })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/g4/fitment/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setPreviews([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleApproval = (index: number) => {
    const newPreviews = [...previews];
    newPreviews[index].approved = !newPreviews[index].approved;
    setPreviews(newPreviews);
  };

  const rows = previews.map((p, index) => [
    <input type="checkbox" checked={p.approved} onChange={() => toggleApproval(index)} />,
    p.id,
    p.proposed.metafields[0].value,
  ]);

  return (
    <Page title={t('G4.FitmentManager.Title', 'Araç Uyumluluk (Fitment) Yöneticisi')}>
      <Layout>
        <Layout.Section>
          {success && (
            <Banner title={t('G4.Success', 'Changes committed successfully!')} tone="success" />
          )}
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text as="h2" variant="headingMd">
                {t('G4.FitmentManager.Description', 'Manage sidekick.fitment JSON array metafield for product compatibilities.')}
              </Text>
              <br />
              <Button onClick={handlePreview} loading={loading} disabled={previews.length > 0}>
                {t('G4.PreviewChanges', 'Preview Changes')}
              </Button>
            </div>
            
            {previews.length > 0 && (
              <div style={{ padding: '1rem', borderTop: '1px solid #e1e3e5' }}>
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={[
                    t('G4.Approve', 'Approve'),
                    t('G4.ProductId', 'Product ID'),
                    t('G4.FitmentManager.ProposedFitments', 'Proposed Fitment JSON')
                  ]}
                  rows={rows}
                />
                <br />
                <Button variant="primary" onClick={handleCommit} loading={loading}>
                  {t('G4.CommitChanges', 'Commit Changes')}
                </Button>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
