import React, { useState } from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Button, TextField, Checkbox, FormLayout } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function StokTransfer() {
  const { t } = useTranslation();
  const [itemId, setItemId] = useState('gid://shopify/InventoryItem/123456');
  const [quantity, setQuantity] = useState('5');
  const [fromLoc, setFromLoc] = useState('gid://shopify/Location/111');
  const [toLoc, setToLoc] = useState('gid://shopify/Location/222');
  
  const [previews, setPreviews] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const handlePreview = async () => {
    const res = await fetch('/api/g2/transfer/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: itemId, quantity: parseInt(quantity, 10), current: { quantity: parseInt(quantity, 10) } }],
        fromLocationId: fromLoc,
        toLocationId: toLoc
      })
    });
    const json = await res.json();
    if (json.success) {
      // By default approve all for HITL
      setPreviews(json.previews.map((p: any) => ({ ...p, approved: true })));
      setStep(2);
    } else {
      alert(json.error);
    }
  };

  const handleCommit = async () => {
    const res = await fetch('/api/g2/transfer/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previews,
        fromLocationId: fromLoc,
        toLocationId: toLoc
      })
    });
    const json = await res.json();
    if (json.success) {
      alert(t('g2.stokTransfer.success', 'Transfer başarıyla gerçekleşti!'));
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
    <Page title={t('g2.stokTransfer.title', 'Stok Transfer (HITL)')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g2.stokTransfer.step1', 'Adım 1: Transfer Bilgileri')}
              </Text>
              <FormLayout>
                <TextField label={t('g2.stokTransfer.itemId', 'Inventory Item ID')} value={itemId} onChange={setItemId} autoComplete="off" />
                <TextField label={t('g2.stokTransfer.quantity', 'Miktar')} type="number" value={quantity} onChange={setQuantity} autoComplete="off" />
                <TextField label={t('g2.stokTransfer.fromLoc', 'Nereden (Location ID)')} value={fromLoc} onChange={setFromLoc} autoComplete="off" />
                <TextField label={t('g2.stokTransfer.toLoc', 'Nereye (Location ID)')} value={toLoc} onChange={setToLoc} autoComplete="off" />
                <Button onClick={handlePreview} disabled={step === 2}>
                  {t('g2.stokTransfer.previewBtn', 'Önizleme Oluştur')}
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
                  {t('g2.stokTransfer.step2', 'Adım 2: Onay ve Kayıt')}
                </Text>
                <DataTable
                  columnContentTypes={['text', 'numeric', 'text', 'text']}
                  headings={[
                    t('g2.stokTransfer.colId', 'Item ID'),
                    t('g2.stokTransfer.colQuantity', 'Miktar'),
                    t('g2.stokTransfer.colStatus', 'Önerilen'),
                    t('g2.stokTransfer.colApprove', 'Onay')
                  ]}
                  rows={previews.map((p, index) => [
                    p.id,
                    p.proposed.quantity,
                    `${p.proposed.fromLocationId} -> ${p.proposed.toLocationId}`,
                    <Checkbox
                      label=""
                      checked={p.approved}
                      onChange={() => toggleApproval(index)}
                    />
                  ])}
                />
                <Button tone="success" onClick={handleCommit}>
                  {t('g2.stokTransfer.commitBtn', 'Onaylananları Kaydet')}
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
