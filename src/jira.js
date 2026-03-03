import api, { route } from '@forge/api';

export async function submitDeployment(payload) {
  const response = await api.asApp().requestJira(
    route`/rest/deployments/0.1/bulk`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
