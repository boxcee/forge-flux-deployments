import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Form, FormHeader, FormSection, FormFooter,
  Label, Textfield, Button, useForm,
  SectionMessage, Stack, Text, Heading,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [status, setStatus] = useState(null);
  const [urls, setUrls] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
