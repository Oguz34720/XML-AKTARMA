import React, { useState, useEffect, useRef } from 'react';
import { Page, Layout, Card, TextField, Button, ProgressBar, Text, BlockStack, Box, Badge } from '@shopify/polaris';

export default function ImageProcessor() {
  const [limit, setLimit] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<{ id: number, text: string, type: 'success' | 'error' | 'info' }[]>([]);
  const [summary, setSummary] = useState({ success: 0, error: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  const startProcess = () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setTotal(0);
    setSummary({ success: 0, error: 0 });

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);

    const eventSource = new EventSource(`/api/image-processor/run?${queryParams.toString()}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'START') {
        setTotal(data.total);
        addLog(`Started processing ${data.total} products.`, 'info');
      } else if (data.type === 'PROGRESS') {
        setProgress(data.current);
        const logType = data.status === 'success' ? 'success' : 'error';
        const prefix = data.status === 'success' ? '✅' : '❌';
        addLog(`[${data.current}/${data.total}] ${prefix} ${data.productName} ${data.error ? `- ${data.error}` : ''}`, logType);
        
        if (data.status === 'success') {
          setSummary(prev => ({ ...prev, success: prev.success + 1 }));
        } else {
          setSummary(prev => ({ ...prev, error: prev.error + 1 }));
        }
      } else if (data.type === 'DONE') {
        addLog(`Completed! ${data.success} successful, ${data.error} failed.`, 'info');
        setIsRunning(false);
        eventSource.close();
      } else if (data.type === 'INFO') {
         addLog(`ℹ️ ${data.message}`, 'info');
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      addLog("❌ Connection lost or error occurred.", "error");
      setIsRunning(false);
      eventSource.close();
    };
  };

  const addLog = (text: string, type: 'success' | 'error' | 'info') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <Page title="🖼️ AI Image Processor">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Configure Processing</Text>
              <TextField
                label="Kaç ürün işlensin? (boş = tümü)"
                value={limit}
                onChange={setLimit}
                autoComplete="off"
                type="number"
                disabled={isRunning}
              />
              <Button onClick={startProcess} disabled={isRunning} variant="primary">
                🚀 İşlemi Başlat
              </Button>

              {total > 0 && (
                <BlockStack gap="200">
                  <Text as="p">İlerleme: {progress} / {total}</Text>
                  <ProgressBar progress={total > 0 ? (progress / total) * 100 : 0} />
                </BlockStack>
              )}

              <Box padding="400" background="bg-surface-secondary" borderRadius="100" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                <BlockStack gap="100">
                  {logs.map(log => (
                    <div key={log.id} style={{ color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'inherit' }}>
                      {log.text}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </BlockStack>
              </Box>

              {!isRunning && total > 0 && (
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Özet</Text>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Badge tone="success">Başarılı: {summary.success}</Badge>
                    <Badge tone="critical">Hatalı: {summary.error}</Badge>
                  </div>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
