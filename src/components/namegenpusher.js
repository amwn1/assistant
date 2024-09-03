import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://thenameexperts.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { domain } = req.query;

  if (domain) {
    try {
      // GoDaddy OTE API credentials
      const apiKey = '3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa';
      const apiSecret = '3MLCLyegkYhPjTkUa48qM2';
      const apiUrl = `https://api.ote-godaddy.com/v1/domains/available?domain=${domain}&checkType=FULL&forTransfer=false`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `sso-key ${apiKey}:${apiSecret}`
        }
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error fetching domain availability:', errorResponse);
        return res.status(response.status).json({ message: errorResponse.message });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching domain availability:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    // Handle fetching content logic here if needed
  }
}
