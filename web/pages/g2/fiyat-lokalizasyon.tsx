import React, { useState } from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Button, TextField, Checkbox, FormLayout } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function FiyatLokalizasyon() {
  const { t } = useTranslation();
  const [priceListId, setPriceListId] = useState('gid://shopify/PriceList/123');
  const [itemId, setItemId] = useState('gid://shopify/ProductVariant/456');
  const [price, setPrice] = useState('150.00');
  
  const [previews, setPreviews] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const handlePreview = async () => {
    const res = await fetch('/api/g2/lokalizasyon/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: itemId, price, current: { price } }],
        priceListId
      })
    });
    const json = await res.json();
    if (json.success) {
      setPreviews(json.previews.map((p: any) => ({ ...p, approved: true })));
      setStep(2);
    } else {
      alert(json.error);
    }
  };

  const handleCommit = async () => {
    const res = await fetch('/api/g2/lokalizasyon/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previews })
    });
    const json = await res.json();
    if (json.success) {
      alert(t('g2.fiyatLokalizasyon.success', 'Lokalizasyon fiyatı başarıyla eklendi!'));
      setStep(1);
      setPreviews([]);
    } else {
      alert(json.error);
    }
  };

  const toggleApproval = (index: number) => {
    const newPreviews = [...previews];
    newPreviews[index].approved = !newPreviews[index].approved;
    setPreviews(newPreviews);
  };

  return (
    <Page title={t('g2.fiyatLokalizasyon.title', 'Lokalizasyon Fiyat Yöneticisi (HITL)')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g2.fiyatLokalizasyon.step1', 'Adım 1: Yeni Fiyat Belirle')}
              </Text>
              <FormLayout>
                <TextField label={t('g2.fiyatLokalizasyon.priceListId', 'Price List ID')} value={priceListId} onChange={setPriceListId} autoComplete="off" />
                <TextField label={t('g2.fiyatLokalizasyon.itemId', 'Variant ID')} value={itemId} onChange={setItemId} autoComplete="off" />
                <TextField label={t('g2.fiyatLokalizasyon.price', 'Yeni Fiyat')} type="number" value={price} onChange={setPrice} autoComplete="off" />
                <Button onClick={handlePreview} disabled={step === 2}>
                  {t('g2.fiyatLokalizasyon.previewBtn', 'Önizleme Oluştur')}
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        {step === 2 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('g2.fiyatLokalizasyon.step2', 'Adım 2: Onay ve Kayıt')}
                </Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={[
                    t('g2.fiyatLokalizasyon.colListId', 'Liste ID'),
                    t('g2.fiyatLokalizasyon.colVariant', 'Varyant ID'),
                    t('g2.fiyatLokalizasyon.colPrice', 'Fiyat'),
                    t('g2.fiyatLokalizasyon.colApprove', 'Onay')
                  ]}
                  rows={previews.map((p, index) => [
                    p.proposed.priceListId,
                    p.id,
                    p.proposed.price,
                    <Checkbox
                      label=""
                      checked={p.approved}
                      onChange={() => toggleApproval(index)}
                    />
                  ])}
                />
                <Button tone="success" onClick={handleCommit}>
                  {t('g2.fiyatLokalizasyon.commitBtn', 'Onaylananları Kaydet')}
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
