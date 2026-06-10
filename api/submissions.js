export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const pwd = req.headers['x-dashboard-password'];
  console.log('pwd_len:', pwd ? pwd.length : 0, 'env_len:', process.env.DASHBOARD_PASSWORD ? process.env.DASHBOARD_PASSWORD.length : 0, 'env_set:', !!process.env.DASHBOARD_PASSWORD);
  if (!pwd || pwd !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const response = await fetch(
      'https://ffyrpjwqtxharjgqqisn.supabase.co/rest/v1/submissions?select=*&order=created_at.desc',
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}
