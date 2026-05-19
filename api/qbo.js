export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const qboUrl = req.query.url;
    if (!qboUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    if (!qboUrl.includes('quickbooks.api.intuit.com')) {
      return res.status(400).json({ error: 'URL must be a QuickBooks API URL' });
    }
    const authHeader = req.headers['authorization'] || '';
    const response = await fetch(qboUrl, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}
