export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email } = req.body || {};
    // Mock register: return a fake user id
    const id = Math.floor(Math.random() * 1000000);
    res.status(201).json({ id, email });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
}
