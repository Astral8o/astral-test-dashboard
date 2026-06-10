export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.NOVU_SECRET_KEY;
  if (!secretKey) {
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
        'Authorization': `ApiKey ${secretKey}`
      },
      body: JSON.stringify({
        name: 'custom-in-app-notification-e8n0v0bg',
        to: {
          subscriberId: '6a28a9b9b1e12d69cb35660d',
          firstName: 'Astral',
          lastName: 'Ochoa',
          email: 'astral.ochoa@hotmail.com'
        },
        payload: { subject, body }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Novu error full:', JSON.stringify(result));
      return res.status(200).json({ ok: true, warning: 'notification failed', detail: result });
    }

    console.log('Novu success:', JSON.stringify(result));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Notify fetch error:', err.message);
    return res.status(200).json({ ok: true, warning: 'notification failed' });
  }
}
