export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const targetUrl    = req.query.url;
    const token        = req.query.token;
    const authType     = req.query.authtype;
    const targetMethod = (req.query.method || req.method).toUpperCase();

    if (!targetUrl) return res.status(400).json({ error: 'Missing url param' });

    const allowed =
      targetUrl.includes('quickbooks.api.intuit.com') ||
      targetUrl.includes('api.wise.com')              ||
      targetUrl.includes('api.mercury.com')           ||
      targetUrl.includes('webdav.drivehq.com');
    if (!allowed) return res.status(400).json({ error: 'URL not allowed' });

    const headers = { 'Accept': '*/*' };

    // Only add Authorization header when a token is provided
    if (token) {
      const authHeader =
        authType === 'apikey' ? `api-key ${token}` :
        authType === 'basic'  ? `Basic ${token}`   :
                                `Bearer ${token}`;
      headers['Authorization'] = authHeader;
    }

    const fetchOpts = { method: targetMethod, headers };

    // Read raw body for write methods
    if (['PUT', 'POST', 'PATCH'].includes(targetMethod)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyBuf = Buffer.concat(chunks);
      fetchOpts.body = bodyBuf;
      headers['Content-Type']   = req.headers['content-type'] || 'application/json';
      headers['Content-Length'] = bodyBuf.length.toString();
    }

    const resp = await fetch(targetUrl, fetchOpts);
    const text = await resp.text();
    if (!text || text.length === 0) return res.status(resp.status).json({ status: resp.status, body: '' });
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(resp.status).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
