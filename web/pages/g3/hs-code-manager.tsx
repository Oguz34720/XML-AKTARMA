import { useState } from 'react';
import { Page, Layout, Card, TextField, Button, DataTable, BlockStack, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function HSCodeManager() {
    const { t } = useTranslation();
    const fetch = useAuthenticatedFetch();
    const [productId, setProductId] = useState('');
    const [description, setDescription] = useState('');
    const [hsCode, setHsCode] = useState('');
    const [midCode, setMidCode] = useState('');
    const [previews, setPreviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSuggest = async () => {
        if (!description) return;
        setSuggesting(true);
        setError('');
        try {
            const res = await fetch('/api/g3/hs-code/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            const data = await res.json();
            if (res.ok) {
                setHsCode(data.suggestedHsCode || '');
            } else {
                setError(data.error || 'Failed to suggest HS Code');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSuggesting(false);
        }
    };

    const handlePreview = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const item = {
                id: productId,
                hsCode,
                currentDescription: description
            };
            const res = await fetch('/api/g3/hs-code/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [item], midCode })
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
            const res = await fetch('/api/g3/hs-code/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ previews: approvedPreviews })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(t('HS Kodu ve MID başarıyla güncellendi.'));
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
        p.proposed?.harmonizedSystemCode,
        p.proposed?.descriptionHtml,
        'Ready to commit'
    ]);

    return (
        <Page title={t("HS Kodu Yöneticisi")}>
            <Layout>
                <Layout.Section>
                    {error && <Banner tone="critical">{error}</Banner>}
                    {success && <Banner tone="success">{success}</Banner>}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">{t("Ürün Detayları")}</Text>
                            <TextField label={t("Product ID")} value={productId} onChange={setProductId} autoComplete="off" />
                            <TextField label={t("Ürün Açıklaması")} value={description} onChange={setDescription} multiline={4} autoComplete="off" />
                            <Button onClick={handleSuggest} loading={suggesting}>{t("AI HS Kodu Önerisi Al")}</Button>
                            
                            <TextField 
                                label={t("HS Kodu (6 Hane)")} 
                                value={hsCode} 
                                onChange={setHsCode} 
                                autoComplete="off" 
                                helpText={t("Tam olarak 6 hane olmalıdır.")}
                                error={hsCode && !/^\d{6}$/.test(hsCode) ? t("Geçersiz HS Kodu (6 hane olmalı)") : false}
                            />
                            <TextField label={t("MID Code")} value={midCode} onChange={setMidCode} autoComplete="off" />
                            
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
                                    columnContentTypes={['text', 'text', 'text', 'text']}
                                    headings={[t("Product ID"), t("Yeni HS Kodu"), t("Yeni Açıklama"), t("Durum")]}
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
