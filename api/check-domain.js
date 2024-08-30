// /api/check-domain.js
import fetch from 'node-fetch';

export default async (req, res) => {
  const { domainName } = req.query;

  if (!domainName) {
    return res.status(400).json({ error: 'Domain name is required' });
  }

  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  try {
    const response = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domainName}`, {
      method: 'GET',
      headers: {
        Authorization: `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json(data);
    } else {
      return res.status(response.status).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check domain availability' });
  }
};
