// api/checkDomainAvailability.js
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "https://thenameexperts.com");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
  
    try {
      const { domain } = req.query;
  
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }
  
      const apiKey = process.env.GODADDY_API_KEY;
      const apiSecret = process.env.GODADDY_API_SECRET;
  
      const response = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
        headers: {
          'Authorization': `sso-key ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`GoDaddy API error: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Error checking domain availability:', error);
      res.status(500).json({ message: 'Failed to check domain availability' });
    }
  }
  