export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasAPIKey: !!process.env.API_KEY,
    endpoint: 'Princeton AI Sandbox'
  });
}
