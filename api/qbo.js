export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const qboUrl = req.query.url;
    const token  = req.query.token;

    if (!qboUrl) return res.status(400).json({ error: 'Missing url param' });
    if (!qboUrl.includes('quickbooks.api.intuit.com'))
      return res.status(400).json({ error: 'Invalid URL' });

    const resp = await fetch(qboUrl, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      }
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(resp.status).json(data);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
