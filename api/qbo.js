export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const targetUrl = req.query.url;
    const token     = req.query.token;
    const authType  = req.query.authtype;

    if (!targetUrl) return res.status(400).json({ error: 'Missing url param' });

    const allowed =
      targetUrl.includes('quickbooks.api.intuit.com') ||
      targetUrl.includes('api.wise.com')              ||
      targetUrl.includes('api.mercury.com')           ||
      targetUrl.includes('webdav.drivehq.com');

    if (!allowed) return res.status(400).json({ error: 'URL not allowed' });

    const authHeader =
      authType === 'apikey' ? `api-key ${token}` :
      authType === 'basic'  ? `Basic ${token}`   :
                              `Bearer ${token}`;

    const fetchOpts = {
      method: req.method,
      headers: {
        'Authorization': token ? authHeader : '',
        'Accept': '*/*',
      }
    };

    if (req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      fetchOpts.body = Buffer.concat(chunks);
      fetchOpts.headers['Content-Type'] = 'application/json';
    }

    const resp = await fetch(targetUrl, fetchOpts);
    const text = await resp.text();

    if (!text || text.length === 0) return res.status(resp.status).end();

    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(resp.status).json(data);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
  }
}
