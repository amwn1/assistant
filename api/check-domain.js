import { URLSearchParams } from "url";

// Read environment variables from Vercel
const API_KEY = process.env.GODADDY_API_KEY;
const API_SECRET = process.env.GODADDY_API_SECRET;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow any origin or specify your domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "POST") {
      const { domain } = req.body;

      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      const encodedDomain = encodeURIComponent(domain);
      const url = `https://api.ote-godaddy.com/v1/domains/available?domain=${encodedDomain}&checkType=FAST&forTransfer=false`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `sso-key 3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa:3MLCLyegkYhPjTkUa48qM2`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Determine if the domain is available
        const available = data.domains[0]?.available || false;
        return res.status(200).json({ available });
      } else {
        return res.status(response.status).json(data);
      }
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error checking domain:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
