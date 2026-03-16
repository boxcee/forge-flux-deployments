import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Form, FormHeader, FormSection, FormFooter,
  Label, Textfield, Button, useForm,
  SectionMessage, Stack, Text, Heading,
  Tabs, Tab, TabList, TabPanel,
  Select, Lozenge, Box, Inline, DynamicTable, Spinner, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const statCardStyles = xcss({
  backgroundColor: 'color.background.neutral',
  padding: 'space.200',
  borderRadius: 'border.radius.100',
});

function statusBadge(code) {
  const map = {
    200: { appearance: 'success', label: '200 OK' },
    204: { appearance: 'default', label: '204 Skipped' },
    400: { appearance: 'removed', label: '400 Bad Request' },
    401: { appearance: 'removed', label: '401 Unauthorized' },
    502: { appearance: 'removed', label: '502 Bad Gateway' },
    503: { appearance: 'removed', label: '503 Service Unavailable' },
  };
  const entry = map[code] || { appearance: 'removed', label: String(code) };
  return <Lozenge appearance={entry.appearance}>{entry.label}</Lozenge>;
}

function formatSource(src) {
  if (src === 'flux') return 'Flux';
  if (src === 'argocd') return 'Argo';
  return src || '--';
}

const tableHead = {
  cells: [
    { key: 'timestamp', content: 'Time', width: 20 },
    { key: 'source', content: 'Source', width: 10 },
    { key: 'status_code', content: 'Status', width: 15 },
    { key: 'release_name', content: 'Release', width: 20 },
    { key: 'env', content: 'Environment', width: 10 },
    { key: 'deployments', content: 'Deployments', width: 10 },
    { key: 'error', content: 'Error', width: 15 },
  ],
};

const EventLogPanel = () => {
  const [source, setSource] = useState('');
  const [stats, setStats] = useState({ accepted: 0, failed: 0, skipped: 0 });
  const [events, setEvents] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [eventsError, setEventsError] = useState(false);

  const fetchData = async (src) => {
    setLoading(true);
    setStatsError(false);
    setEventsError(false);

    const statsPromise = invoke('getEventStats', { source: src || undefined })
      .then(data => { setStats(data); })
      .catch(() => { setStatsError(true); setStats({ accepted: 0, failed: 0, skipped: 0 }); });

    const eventsPromise = invoke('getEventLog', { source: src || undefined })
      .then(data => { setEvents(data.events); setHasMore(data.hasMore); })
      .catch(() => { setEventsError(true); setEvents([]); setHasMore(false); });

    await Promise.all([statsPromise, eventsPromise]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(source);
  }, [source]);

  const handleSourceChange = (val) => {
    setSource(val);
  };

  const handleLoadMore = async () => {
    if (events.length === 0) return;
    setLoadingMore(true);
    const lastEvent = events[events.length - 1];
    try {
      const data = await invoke('getEventLog', {
        source: source || undefined,
        beforeTimestamp: lastEvent.timestamp,
        beforeId: lastEvent.id,
      });
      setEvents(prev => [...prev, ...data.events]);
      setHasMore(data.hasMore);
    } catch {
      /* swallow — existing data preserved */
    }
    setLoadingMore(false);
  };

  const tableRows = events.map((evt, idx) => ({
    key: String(evt.id || idx),
    cells: [
      { key: 'timestamp', content: new Date(evt.timestamp).toLocaleString() },
      { key: 'source', content: formatSource(evt.source) },
      { key: 'status_code', content: statusBadge(evt.status_code) },
      { key: 'release_name', content: evt.release_name || '--' },
      { key: 'env', content: evt.env || '--' },
      { key: 'deployments', content: (evt.accepted != null || evt.rejected != null) ? `${evt.accepted ?? 0}A / ${evt.rejected ?? 0}R` : '--' },
      { key: 'error', content: evt.error ? (evt.error.length > 50 ? evt.error.slice(0, 50) + '...' : evt.error) : '--' },
    ],
  }));

  if (loading) {
    return <Spinner size="large" />;
  }

  return (
    <Stack space="space.300">
      <Select
        label="Source"
        value={source}
        onChange={handleSourceChange}
        options={[
          { label: 'All sources', value: '' },
          { label: 'Flux', value: 'flux' },
          { label: 'Argo', value: 'argocd' },
        ]}
      />

      {statsError && (
        <SectionMessage appearance="warning">
          <Text>Could not load stats. Event log may still be available.</Text>
        </SectionMessage>
      )}

      <Stack space="space.100">
        <Text>Last 24 hours</Text>
        <Inline space="space.200" spread="fill">
          <Box xcss={statCardStyles}>
            <Stack>
              <Text weight="bold">Accepted</Text>
              <Heading as="h3">{String(stats.accepted)}</Heading>
            </Stack>
          </Box>
          <Box xcss={statCardStyles}>
            <Stack>
              <Text weight="bold">Failed</Text>
              <Heading as="h3">{String(stats.failed)}</Heading>
            </Stack>
          </Box>
          <Box xcss={statCardStyles}>
            <Stack>
              <Text weight="bold">Skipped</Text>
              <Heading as="h3">{String(stats.skipped)}</Heading>
            </Stack>
          </Box>
        </Inline>
      </Stack>

      {eventsError ? (
        <SectionMessage appearance="error">
          <Text>Failed to load event log. Try refreshing the page.</Text>
        </SectionMessage>
      ) : (
        <>
          <DynamicTable
            head={tableHead}
            rows={tableRows}
            isLoading={false}
            emptyView={
              <Stack space="space.200">
                <Heading as="h3">No webhook events yet</Heading>
                <Text>Events will appear here after your first FluxCD or ArgoCD webhook fires.</Text>
              </Stack>
            }
          />
          {hasMore && (
            <Button
              appearance="default"
              onClick={handleLoadMore}
              isDisabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </>
      )}
    </Stack>
  );
};

const App = () => {
  const [status, setStatus] = useState(null);
  const [urls, setUrls] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    invoke('getConfigStatus')
      .then(setStatus)
      .catch(err => setFeedback({ type: 'error', msg: 'Failed to load config status: ' + String(err) }));
    invoke('getWebtriggerUrls')
      .then(setUrls)
      .catch(err => console.error('getWebtriggerUrls error:', err));
  }, []);

  const fluxForm = useForm();
  const argoForm = useForm();

  const saveFlux = async (data) => {
    setFeedback(null);
    try {
      const result = await invoke('setFluxSecret', { secret: data.fluxSecret });
      setFeedback(result.success
        ? { type: 'success', msg: 'FluxCD secret saved' }
        : { type: 'error', msg: result.error });
      if (result.success) setStatus(s => ({ ...s, flux: { configured: true } }));
    } catch (err) {
      console.error('saveFlux error:', err);
      setFeedback({ type: 'error', msg: 'Error: ' + String(err) });
    }
  };

  const saveArgo = async (data) => {
    setFeedback(null);
    try {
      const result = await invoke('setArgoSecret', { token: data.argoToken });
      setFeedback(result.success
        ? { type: 'success', msg: 'ArgoCD token saved' }
        : { type: 'error', msg: result.error });
      if (result.success) setStatus(s => ({ ...s, argocd: { configured: true } }));
    } catch (err) {
      console.error('saveArgo error:', err);
      setFeedback({ type: 'error', msg: 'Error: ' + String(err) });
    }
  };

  return (
    <Stack space="space.300">
      <Heading as="h2">GitOps Deployments Configuration</Heading>
      <Tabs onChange={setActiveTab} selected={activeTab} id="admin-tabs">
        <TabList>
          <Tab>Settings</Tab>
          <Tab>Event Log</Tab>
        </TabList>
        <TabPanel>
          <Stack space="space.300">
            {feedback && (
              <SectionMessage appearance={feedback.type === 'success' ? 'success' : 'error'}>
                <Text>{feedback.msg}</Text>
              </SectionMessage>
            )}

            {urls && (
              <SectionMessage appearance="information">
                <Text>FluxCD webhook URL: {urls.flux}</Text>
                <Text>ArgoCD webhook URL: {urls.argocd}</Text>
              </SectionMessage>
            )}

            <Form onSubmit={fluxForm.handleSubmit(saveFlux)}>
              <FormHeader title="FluxCD HMAC Secret" />
              <FormSection>
                <Label labelFor={fluxForm.getFieldId('fluxSecret')}>
                  Webhook Secret {status?.flux?.configured ? '(configured)' : '(not configured)'}
                </Label>
                <Textfield
                  type="password"
                  placeholder={status?.flux?.configured ? '••••••••••• (secret is set — enter new value to replace)' : 'Enter HMAC secret (min 8 characters)'}
                  {...fluxForm.register('fluxSecret', { required: true, minLength: 8 })}
                />
              </FormSection>
              <FormFooter>
                <Button appearance="primary" type="submit">Save FluxCD Secret</Button>
              </FormFooter>
            </Form>

            <Form onSubmit={argoForm.handleSubmit(saveArgo)}>
              <FormHeader title="ArgoCD Bearer Token" />
              <FormSection>
                <Label labelFor={argoForm.getFieldId('argoToken')}>
                  Bearer Token {status?.argocd?.configured ? '(configured)' : '(not configured)'}
                </Label>
                <Textfield
                  type="password"
                  placeholder={status?.argocd?.configured ? '••••••••••• (token is set — enter new value to replace)' : 'Enter bearer token (min 8 characters)'}
                  {...argoForm.register('argoToken', { required: true, minLength: 8 })}
                />
              </FormSection>
              <FormFooter>
                <Button appearance="primary" type="submit">Save ArgoCD Token</Button>
              </FormFooter>
            </Form>
          </Stack>
        </TabPanel>
        <TabPanel>
          <EventLogPanel />
        </TabPanel>
      </Tabs>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
