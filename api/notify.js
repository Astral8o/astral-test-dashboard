export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    // Notifications not configured — non-fatal, submission already saved
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { type, site_id, name, service_type } = req.body || {};

  const heading = type === 'inquiry'
    ? 'New inquiry received'
    : 'New booking request';

  const body = name
    ? (type === 'inquiry'
        ? `${name} sent a message via ${site_id || 'your site'}`
        : `${name} requested: ${service_type || 'a service'}`)
    : 'A new submission just came in';

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Total Subscriptions'],
        headings: { en: heading },
        contents: { en: body },
        data: { type, site_id }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('OneSignal error:', result);
      return res.status(200).json({ ok: true, warning: 'notification failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Notify error:', err);
    return res.status(200).json({ ok: true, warning: 'notification failed' });
  }
}
