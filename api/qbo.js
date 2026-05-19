export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const path = req.url.replace('/api/qbo', '');
  const base = req.query.env === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';
  const qboUrl = base + path;
  try {
    const resp = await fetch(qboUrl, {
      headers: {
        'Authorization': req.headers.authorization || '',
        'Accept': 'application/json'
      }
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
