import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Button, Toast, Text } from '@shopify/polaris';

export default function StoreConfig() {
  const [config, setConfig] = useState({
    ticimaxFtpHost: '',
    ticimaxFtpUser: '',
    ticimaxFtpPass: '',
    fedexClientId: '',
    fedexSecret: '',
    fedexAccount: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetch('/api/g7/store-config')
      .then(res => res.json())
      .then(data => setConfig({
        ticimaxFtpHost: data.ticimaxFtpHost || '',
        ticimaxFtpUser: data.ticimaxFtpUser || '',
        ticimaxFtpPass: data.ticimaxFtpPass ? '********' : '',
        fedexClientId: data.fedexClientId || '',
        fedexSecret: data.fedexSecret ? '********' : '',
        fedexAccount: data.fedexAccount || ''
      }));
  }, []);

  const handleChange = (value: string, id: string) => {
    setConfig(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Don't send dummy passwords if untouched
    const payload = { ...config } as any;
    if (payload.ticimaxFtpPass === '********') delete payload.ticimaxFtpPass;
    if (payload.fedexSecret === '********') delete payload.fedexSecret;

    try {
      const res = await fetch('/api/g7/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToastMessage('Ayarlar başarıyla kaydedildi ve şifrelendi (AES-256).');
      } else {
        setToastMessage('Kaydedilirken hata oluştu.');
      }
    } catch (e: any) {
      setToastMessage(e.message);
    }
    setLoading(false);
  };

  return (
    <Page title="Mağaza Ayarları & Multi-Store Konfigürasyonu">
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <FormLayout>
              <Text variant="headingMd" as="h2">Ticimax FTP Entegrasyonu</Text>
              <TextField label="FTP Host" value={config.ticimaxFtpHost} onChange={(v) => handleChange(v, 'ticimaxFtpHost')} autoComplete="off" />
              <TextField label="FTP Kullanıcı Adı" value={config.ticimaxFtpUser} onChange={(v) => handleChange(v, 'ticimaxFtpUser')} autoComplete="off" />
              <TextField label="FTP Şifresi" type="password" value={config.ticimaxFtpPass} onChange={(v) => handleChange(v, 'ticimaxFtpPass')} autoComplete="off" helpText="AES-256-GCM ile veritabanında şifreli tutulacaktır." />
            </FormLayout>
          </Card>

          <Card padding="400">
            <FormLayout>
              <Text variant="headingMd" as="h2">FedEx API Entegrasyonu</Text>
              <TextField label="Client ID" value={config.fedexClientId} onChange={(v) => handleChange(v, 'fedexClientId')} autoComplete="off" />
              <TextField label="Client Secret" type="password" value={config.fedexSecret} onChange={(v) => handleChange(v, 'fedexSecret')} autoComplete="off" />
              <TextField label="Hesap Numarası (Account Number)" value={config.fedexAccount} onChange={(v) => handleChange(v, 'fedexAccount')} autoComplete="off" />
            </FormLayout>
          </Card>

          <div style={{ marginTop: '20px' }}>
            <Button variant="primary" onClick={handleSave} loading={loading}>Ayarları Şifreleyerek Kaydet</Button>
          </div>
        </Layout.Section>
      </Layout>
      {toastMessage && (
        <Toast content={toastMessage} onDismiss={() => setToastMessage('')} />
      )}
    </Page>
  );
}
