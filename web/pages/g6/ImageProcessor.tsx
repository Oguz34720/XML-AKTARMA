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

  const startProcess = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setTotal(0);
    setSummary({ success: 0, error: 0 });

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);

    try {
      const res = await fetch(`/api/image-processor/start?${queryParams.toString()}`, { method: 'POST' });
      const data = await res.json();
      if (data.jobId) {
        pollStatus(data.jobId);
      } else {
        throw new Error("No jobId returned");
      }
    } catch (err) {
      console.error(err);
      addLog("❌ Failed to start job.", "error");
      setIsRunning(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    try {
      const res = await fetch(`/api/image-processor/status/${jobId}`);
      if (!res.ok) throw new Error("Job not found or server error");
      const job = await res.json();
      
      setTotal(job.total);
      setProgress(job.current);
      setSummary({ success: job.success, error: job.errorCount });
      setLogs(job.logs);

      if (job.done) {
        setIsRunning(false);
      } else {
        setTimeout(() => pollStatus(jobId), 3000);
      }
    } catch (err) {
      console.error(err);
      addLog("❌ Polling failed or connection lost.", "error");
      setIsRunning(false);
    }
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

              <Box padding="400" background="bg-surface-secondary" borderRadius="100">
                <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace' }}>
                  <BlockStack gap="100">
                    {logs.map(log => (
                      <div key={log.id} style={{ color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'inherit' }}>
                        {log.text}
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </BlockStack>
                </div>
              </Box>

              {!isRunning && total > 0 && (
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Özet</Text>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Badge tone="success">{`Başarılı: ${summary.success}`}</Badge>
                    <Badge tone="critical">{`Hatalı: ${summary.error}`}</Badge>
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
