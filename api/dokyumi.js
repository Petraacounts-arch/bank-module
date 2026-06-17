// api/dokyumi.js — Vercel serverless proxy for Dokyumi document extraction
//
// WHY THIS EXISTS:
//   Dokyumi keys must stay server-side and the API is not browser-callable.
//   This is the same proxy pattern your app already uses for QuickBooks.
//
// SETUP:
//   1. Drop this file in your repo at /api/dokyumi.js (same project as /api/qbo).
//   2. KEY — choose either (or both):
//        a) Enter the dk_live_ key in the app's Dokyumi modal (sent per-request), OR
//        b) Vercel → Settings → Environment Variables: DOKYUMI_API_KEY = dk_live_xxxx
//           (used automatically when the app leaves the key field blank).
//   3. Redeploy. The browser calls https://<your-vercel>/api/dokyumi
//
// The browser sends JSON { filename, mime, b64, schema }; this function rebuilds
// a multipart upload to Dokyumi so the key never touches the client.

export const config = {
  api: { bodyParser: { sizeLimit: '30mb' } } // base64 of a 20MB PDF ≈ 27MB
};

export default async function handler(req, res) {
  // CORS — allow the Bank Module page to call this proxy
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, mime, b64, schema, apiKey } = req.body || {};
    if (!b64) return res.status(400).json({ error: 'Missing file (b64)' });

    // Use the key the app sent, otherwise fall back to the server-side env var.
    const key = (apiKey && apiKey.trim()) || process.env.DOKYUMI_API_KEY;
    if (!key) return res.status(400).json({ error: 'No API key provided and DOKYUMI_API_KEY not configured on server' });

    const bytes = Buffer.from(b64, 'base64');
    const form = new FormData(); // Node 18+ on Vercel has global FormData/Blob/fetch
    form.append('file', new Blob([bytes], { type: mime || 'application/pdf' }), filename || 'statement.pdf');
    if (schema) form.append('schema', schema);

    const r = await fetch('https://dokyumi.com/api/v1/extract', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` }, // do NOT set Content-Type; fetch sets the multipart boundary
      body: form
    });

    const data = await r.json();
    return res.status(r.status).json(data); // pass Dokyumi's status + body straight through
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Proxy error' });
  }
}
