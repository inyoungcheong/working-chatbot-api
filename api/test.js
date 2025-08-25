module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({ 
    message: 'Hello from Vercel!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};
