import React, { useState, useCallback } from 'react';
import { Page, Layout, Card, Text, BlockStack, Form, FormLayout, TextField, Button, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { calcTargetPrice } from '../../../src/lib/margin';

export default function PnlHesaplayici() {
  const { t } = useTranslation();

  const [cost, setCost] = useState('100');
  const [shipping, setShipping] = useState('20');
  const [fixed, setFixed] = useState('10');
  const [marginPct, setMarginPct] = useState('20');
  
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    setError(null);
    setResult(null);
    try {
      const c = parseFloat(cost) || 0;
      const s = parseFloat(shipping) || 0;
      const f = parseFloat(fixed) || 0;
      const m = parseFloat(marginPct) || 0;

      const targetPrice = calcTargetPrice(c, s, f, m);
      setResult(targetPrice);
    } catch (err: any) {
      setError(err.message || t('g5.pnl.error_calculation', 'Hesaplama hatası'));
    }
  }, [cost, shipping, fixed, marginPct, t]);

  return (
    <Page title={t('g5.pnl.title', 'Kar/Zarar (PnL) Hesaplayıcı')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {t('g5.pnl.calculator', 'Satış Fiyatı Hesaplayıcı')}
              </Text>

              <Form onSubmit={handleSubmit}>
                <FormLayout>
                  <TextField
                    label={t('g5.pnl.cost', 'Maliyet')}
                    value={cost}
                    onChange={setCost}
                    type="number"
                    autoComplete="off"
                    prefix="₺"
                  />
                  <TextField
                    label={t('g5.pnl.shipping', 'Kargo')}
                    value={shipping}
                    onChange={setShipping}
                    type="number"
                    autoComplete="off"
                    prefix="₺"
                  />
                  <TextField
                    label={t('g5.pnl.fixed_cost', 'Sabit Gider')}
                    value={fixed}
                    onChange={setFixed}
                    type="number"
                    autoComplete="off"
                    prefix="₺"
                  />
                  <TextField
                    label={t('g5.pnl.margin_pct', 'Hedef Kar Marjı (%)')}
                    value={marginPct}
                    onChange={setMarginPct}
                    type="number"
                    autoComplete="off"
                    suffix="%"
                  />
                  <Button submit variant="primary">
                    {t('g5.pnl.calculate', 'Hesapla')}
                  </Button>
                </FormLayout>
              </Form>

              {error && (
                <Banner tone="critical">
                  <p>{error}</p>
                </Banner>
              )}

              {result !== null && !error && (
                <Banner tone="success" title={t('g5.pnl.result_title', 'Hesaplanan Satış Fiyatı')}>
                  <Text as="p" variant="headingLg">
                    ₺{result.toFixed(2)}
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
