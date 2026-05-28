export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email } = req.body || {};
    // Very small mock: accept any email/password and return a fake token
    const token = Buffer.from((email || 'user') + ':' + Date.now()).toString('base64');
    res.status(200).json({ access_token: token, token_type: 'bearer' });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
}
