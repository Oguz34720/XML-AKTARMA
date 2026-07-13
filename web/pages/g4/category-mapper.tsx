import { useState } from 'react';
import { Page, Layout, Card, Button, DataTable, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function CategoryMapper() {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  
  // Example dummy data
  const dummyProducts = [
    { 
      id: "gid://shopify/Product/1", 
      breadcrumbkat: "VW > Engine Parts > Timing Belts"
    },
    { 
      id: "gid://shopify/Product/2", 
      breadcrumbkat: "VW > Interior > Steering Wheels"
    }
  ];

  const dummyCategoryMapping = {
    "VW > Engine Parts > Timing Belts": "gid://shopify/Collection/111",
    "VW > Interior > Steering Wheels": "gid://shopify/Collection/222"
  };

  const handlePreview = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const response = await fetch('/api/g4/category/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products: dummyProducts, 
          categoryMapping: dummyCategoryMapping 
        }),
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
      const response = await fetch('/api/g4/category/commit', {
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
    p.original.breadcrumbkat,
    p.proposed.collectionId,
  ]);

  return (
    <Page title={t('G4.CategoryMapper.Title', 'Parça Kategorisi Eşleştirici')}>
      <Layout>
        <Layout.Section>
          {success && (
            <Banner title={t('G4.Success', 'Changes committed successfully!')} tone="success" />
          )}
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text as="h2" variant="headingMd">
                {t('G4.CategoryMapper.Description', 'Map BREADCRUMBKAT values to Shopify collections.')}
              </Text>
              <br />
              <Button onClick={handlePreview} loading={loading} disabled={previews.length > 0}>
                {t('G4.PreviewChanges', 'Preview Changes')}
              </Button>
            </div>
            
            {previews.length > 0 && (
              <div style={{ padding: '1rem', borderTop: '1px solid #e1e3e5' }}>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={[
                    t('G4.Approve', 'Approve'),
                    t('G4.ProductId', 'Product ID'),
                    t('G4.CategoryMapper.Breadcrumbkat', 'Breadcrumb Category'),
                    t('G4.CategoryMapper.CollectionId', 'Proposed Collection ID')
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
