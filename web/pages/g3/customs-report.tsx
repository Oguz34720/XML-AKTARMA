import { useState } from 'react';
import { Page, Layout, Card, Button, BlockStack, Text, Banner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';

export default function CustomsReport() {
    const { t } = useTranslation();
    const fetch = useAuthenticatedFetch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExport = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/g3/customs-report/export', {
                method: 'GET'
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'customs_report.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const data = await res.text();
                setError(data || 'Export failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page title={t("Gümrük Raporu")}>
            <Layout>
                <Layout.Section>
                    {error && <Banner tone="critical">{error}</Banner>}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">{t("Gümrük Raporu (Read-Only CSV)")}</Text>
                            <Text as="p">{t("Gümrük işlemleri için gerekli olan ürünlerin HS Kodları, Ağırlık ve Menşei bilgilerini içeren raporu indirebilirsiniz.")}</Text>
                            <Button onClick={handleExport} loading={loading} variant="primary">
                                {t("CSV Olarak İndir")}
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
