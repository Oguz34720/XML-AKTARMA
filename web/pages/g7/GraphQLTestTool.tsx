import React, { useState } from 'react';
import { Page, Layout, Card, Button, Text, TextField } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';

export default function GraphQLTestTool() {
  const { t } = useTranslation();
  
  const [query, setQuery] = useState('{\n  shop {\n    name\n  }\n}');
  const [variables, setVariables] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/g7/graphql-test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: JSON.parse(variables) })
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setLoading(false);
  };

  return (
    <Page title={t('g7.graphqlTest.title', 'GraphQL Test Aracı')}>
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text as="p">{t('g7.graphqlTest.description', 'Execute raw GraphQL queries and mutations.')}</Text>
              <br />
              <TextField
                label={t('g7.graphqlTest.query', 'Query')}
                value={query}
                onChange={setQuery}
                multiline={6}
                autoComplete="off"
              />
              <div style={{ marginTop: '16px' }}>
                <TextField
                  label={t('g7.graphqlTest.variables', 'Variables (JSON)')}
                  value={variables}
                  onChange={setVariables}
                  multiline={3}
                  autoComplete="off"
                />
              </div>
              <br />
              <Button variant="primary" onClick={handleExecute} loading={loading}>
                {t('g7.graphqlTest.execute', 'Execute Query')}
              </Button>
            </div>
          </Card>
        </Layout.Section>
        
        {result && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <Text as="h2" variant="headingMd">{t('g7.graphqlTest.result', 'Result')}</Text>
                <pre style={{ marginTop: '16px', background: '#f4f6f8', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                  {result}
                </pre>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
