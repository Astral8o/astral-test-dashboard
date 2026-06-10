export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  await Promise.allSettled([
    sendNovu(subject, body),
    sendEmail(subject, body, name, service_type, type)
  ]);

  return res.status(200).json({ ok: true });
}

async function sendNovu(subject, body) {
  const secretKey = process.env.NOVU_SECRET_KEY;
  if (!secretKey) return;

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

  if (!response.ok) {
    const result = await response.json();
    console.error('Novu error:', JSON.stringify(result));
  }
}

async function sendEmail(subject, body, name, service_type, type) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const html = type === 'inquiry'
    ? `<p><strong>${name || 'Someone'}</strong> sent a new inquiry via your Lustre Studio site.</p><p>${body}</p>`
    : `<p><strong>${name || 'Someone'}</strong> submitted a new booking request on your Lustre Studio site.</p>
       <p><strong>Services:</strong> ${service_type || 'Not specified'}</p>
       <p>Log in to your <a href="https://astral-test-dashboard.vercel.app/dashboard">dashboard</a> to view the full details.</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'Lustre Studio <onboarding@resend.dev>',
      to: ['astral.ochoa@hotmail.com'],
      subject: `Lustre Studio — ${subject}`,
      html
    })
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`Resend error ${response.status}:`, JSON.stringify(result));
  } else {
    console.log('Resend success:', JSON.stringify(result));
  }
}
