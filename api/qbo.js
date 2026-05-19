export default async function handler(req, res) {
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Strip /api/qbo prefix to get QBO path
    const qboPath = req.url.replace(/^\/api\/qbo/, '') || '/';
    const isSandbox = req.query.env === 'sandbox';
    const base = isSandbox
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
    
    const qboUrl = base + qboPath;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    
    console.log(`QBO Proxy → ${qboUrl}`);
    
    const response = await fetch(qboUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    
    let data;
    try { data = JSON.parse(text); } 
    catch(e) { data = { raw: text }; }

    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy failed', 
      message: error.message 
    });
  }
}
