export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const qboUrl   = req.query.url;
    const token    = req.query.token;
    const authType = req.query.authtype; // 'apikey' for Mercury, default = Bearer

    if (!qboUrl) return res.status(400).json({ error: 'Missing url param' });

    // Allow QBO, Wise, and Mercury
    const allowed =
      qboUrl.includes('quickbooks.api.intuit.com') ||
      qboUrl.includes('api.wise.com')              ||
      qboUrl.includes('api.mercury.com');

    if (!allowed) return res.status(400).json({ error: 'URL not allowed' });

    // Mercury uses "api-key TOKEN", everything else uses "Bearer TOKEN"
    const authHeader = authType === 'apikey'
      ? `api-key ${token}`
      : `Bearer ${token}`;

    const resp = await fetch(qboUrl, {
      headers: {
        'Authorization': token ? authHeader : '',
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
