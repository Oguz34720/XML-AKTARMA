import React, { useState } from 'react';
import { Page, Layout, Card, DataTable, Text, BlockStack, Button, Checkbox, Spinner, Badge } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function FiyatAnomali() {
  const { t } = useTranslation();
  const fetch = useAuthenticatedFetch();
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleScan = async () => {
    setLoading(true);
    const res = await fetch('/api/g2/anomali/preview', { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setPreviews(json.previews.map((p: any) => ({ ...p, approved: true })));
      setStep(2);
    } else {
      alert(json.error);
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    const res = await fetch('/api/g2/anomali/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previews })
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      alert(t('g2.fiyatAnomali.success', 'Düzeltmeler başarıyla uygulandı!'));
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
    <Page title={t('g2.fiyatAnomali.title', 'Fiyat Anomali Dedektörü (HITL)')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g2.fiyatAnomali.step1', 'Adım 1: Mağazayı Tara')}
              </Text>
              <Text as="p">
                {t('g2.fiyatAnomali.desc', 'Fiyatı hatalı olan veya indirim oranı çok yüksek/düşük olan ürünleri tespit edin.')}
              </Text>
              <Button onClick={handleScan} loading={loading && step === 1}>
                {t('g2.fiyatAnomali.scanBtn', 'Anomalileri Tespit Et')}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {step === 2 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {t('g2.fiyatAnomali.step2', 'Adım 2: Onay ve Kayıt')}
                </Text>
                {previews.length === 0 ? (
                  <Text as="p">{t('g2.fiyatAnomali.noAnomalies', 'Hiçbir anomali bulunamadı. Fiyatlar gayet iyi!')}</Text>
                ) : (
                  <>
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'numeric', 'text']}
                      headings={[
                        t('g2.fiyatAnomali.colProduct', 'Varyant (ID)'),
                        t('g2.fiyatAnomali.colCurrent', 'Mevcut Fiyat'),
                        t('g2.fiyatAnomali.colSuggested', 'Önerilen Fiyat'),
                        t('g2.fiyatAnomali.colApprove', 'Onay')
                      ]}
                      rows={previews.map((p, index) => [
                        p.id,
                        <Badge tone="critical">{`Eski: ${p.original.price} -> Yeni: ${p.proposed.price}`}</Badge>,
                        <Badge tone="success">{`Normal: ${p.proposed.price}`}</Badge>,
                        <Checkbox
                          label=""
                          checked={p.approved}
                          onChange={() => toggleApproval(index)}
                        />
                      ])}
                    />
                    <Button tone="success" onClick={handleCommit} loading={loading && step === 2}>
                      {t('g2.fiyatAnomali.commitBtn', 'Seçilenleri Düzelt')}
                    </Button>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
