export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NOVU_API_KEY;
  const workflowId = process.env.NOVU_WORKFLOW_ID;
  const subscriberId = process.env.NOVU_SUBSCRIBER_ID;

  if (!apiKey || !workflowId || !subscriberId) {
    // Notifications not configured — non-fatal, submission already saved
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { type, site_id, name, service_type } = req.body || {};

  const subject = type === 'inquiry'
    ? 'New inquiry received'
    : 'New booking request';

  const body = name
    ? (type === 'inquiry'
        ? `${name} sent a message via ${site_id || 'your site'}`
        : `${name} requested: ${service_type || 'a service'}`)
    : 'A new submission just came in';

  try {
    const response = await fetch('https://api.novu.co/v1/events/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${apiKey}`
      },
      body: JSON.stringify({
        name: workflowId,
        to: { subscriberId },
        payload: { subject, body, type, site_id, name, service_type }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Novu error:', result);
      return res.status(200).json({ ok: true, warning: 'notification failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Notify error:', err);
    return res.status(200).json({ ok: true, warning: 'notification failed' });
  }
}
