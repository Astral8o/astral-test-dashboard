export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, site_id, name, service_type, client_email } = req.body || {};

  await Promise.allSettled([
    sendOwnerEmail(type, name, service_type),
    sendClientConfirmation(type, name, client_email, service_type)
  ]);

  return res.status(200).json({ ok: true });
}

async function sendOwnerEmail(type, name, service_type) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const subject = type === 'inquiry' ? 'New inquiry received' : 'New booking request';

  const html = type === 'inquiry'
    ? `<p><strong>${name || 'Someone'}</strong> sent a new inquiry via your Lustre Studio site.</p>
       <p>Log in to your <a href="https://astral-test-dashboard.vercel.app/dashboard">dashboard</a> to view the full details.</p>`
    : `<p><strong>${name || 'Someone'}</strong> submitted a new booking request.</p>
       <p><strong>Services:</strong> ${service_type || 'Not specified'}</p>
       <p>Log in to your <a href="https://astral-test-dashboard.vercel.app/dashboard">dashboard</a> to view the full details.</p>`;

  await resendEmail('astral.ochoa@hotmail.com', `Lustre Studio — ${subject}`, html);
}

async function sendClientConfirmation(type, name, client_email, service_type) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !client_email) return;

  const subject = type === 'inquiry'
    ? 'We got your message — Lustre Studio'
    : 'Booking request received — Lustre Studio';

  const html = type === 'inquiry'
    ? `<p>Hi ${name || 'there'},</p>
       <p>Thanks for reaching out to Lustre Studio! We've received your message and will get back to you shortly.</p>
       <p>Talk soon,<br/>The Lustre Studio Team</p>`
    : `<p>Hi ${name || 'there'},</p>
       <p>Thanks for your booking request! We've received your request for <strong>${service_type || 'services'}</strong> and will be in touch shortly to confirm your appointment.</p>
       <p>Talk soon,<br/>The Lustre Studio Team</p>`;

  await resendEmail(client_email, subject, html);
}

async function resendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'Lustre Studio <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`Resend error ${response.status}:`, JSON.stringify(result));
  } else {
    console.log('Resend success:', result.id);
  }
}
