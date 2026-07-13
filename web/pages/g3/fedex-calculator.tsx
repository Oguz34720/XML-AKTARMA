import { useState } from 'react';
import { Page, Layout, Card, TextField, Button, DataTable, BlockStack, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function FedExCalculator() {
    const { t } = useTranslation();
    const fetch = useAuthenticatedFetch();
    const [productId, setProductId] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [actualWeight, setActualWeight] = useState('');
    const [previews, setPreviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePreview = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const item = {
                id: productId,
                length, width, height, actualWeight
            };
            const res = await fetch('/api/g3/fedex-calculator/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [item] })
            });
            const data = await res.json();
            if (res.ok) {
                setPreviews(data.previews || []);
            } else {
                setError(data.error || 'Preview failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        setLoading(true);
        setError('');
        try {
            const approvedPreviews = previews.map(p => ({ ...p, approved: true }));
            const res = await fetch('/api/g3/fedex-calculator/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ previews: approvedPreviews })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(t('Kargo ağırlığı başarıyla güncellendi.'));
                setPreviews([]);
            } else {
                setError(data.error || 'Commit failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const rows = previews.map(p => [
        p.id,
        p.proposed?.weight,
        'Ready to commit'
    ]);

    return (
        <Page title={t("FedEx Kargo Hesaplayıcı")}>
            <Layout>
                <Layout.Section>
                    {error && <Banner tone="critical">{error}</Banner>}
                    {success && <Banner tone="success">{success}</Banner>}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">{t("Ürün Boyutları")}</Text>
                            <TextField label={t("Product ID")} value={productId} onChange={setProductId} autoComplete="off" />
                            <TextField label={t("Uzunluk (cm)")} value={length} onChange={setLength} type="number" autoComplete="off" />
                            <TextField label={t("Genişlik (cm)")} value={width} onChange={setWidth} type="number" autoComplete="off" />
                            <TextField label={t("Yükseklik (cm)")} value={height} onChange={setHeight} type="number" autoComplete="off" />
                            <TextField label={t("Gerçek Ağırlık (kg)")} value={actualWeight} onChange={setActualWeight} type="number" autoComplete="off" />
                            <Button onClick={handlePreview} loading={loading}>{t("Önizleme (Phase 1)")}</Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>
                {previews.length > 0 && (
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">{t("Önizleme Sonuçları")}</Text>
                                <DataTable
                                    columnContentTypes={['text', 'numeric', 'text']}
                                    headings={[t("Product ID"), t("Hesaplanan Ağırlık"), t("Status")]}
                                    rows={rows}
                                />
                                <Button onClick={handleCommit} loading={loading} variant="primary">{t("Değişiklikleri Onayla (Phase 2)")}</Button>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                )}
            </Layout>
        </Page>
    );
}
