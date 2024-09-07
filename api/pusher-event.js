import { URLSearchParams } from "url";
import fetch from "node-fetch"; // Ensure you import fetch if using in a Node.js environment

// Temporary in-memory storage for categories and names
let contentArray = [];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow from any origin for testing
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "POST") {
      let body;
      try {
        if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
          body = Object.fromEntries(new URLSearchParams(req.body));
        } else {
          body = req.body;
          if (typeof body === "string") {
            body = JSON.parse(body);
          }
        }
      } catch (error) {
        console.error("Error parsing request:", error, "Received body:", req.body);
        return res.status(400).json({ message: "Invalid request format" });
      }

      const { message } = body;

      if (!message) {
        console.log("No message provided in request body:", body);
        return res.status(400).json({ message: "Bad request, no message provided" });
      }

      // Parse and store content (categories and names) in the contentArray
      contentArray = parseContentFromMessage(message);

      return res.status(200).json({ message: "Data received and content stored successfully" });
    } else if (req.method === "GET") {
      if (contentArray.length === 0) {
        console.log("No content available for GET request");
        return res.status(404).json({ message: "No content available" });
      }

      // Check if a domain is requested for availability check
      const { domain } = req.query;
      if (domain) {
        try {
          // GoDaddy OTE API credentials
          const apiKey = process.env.GODADDY_API_KEY; // Replace with your GoDaddy OTE key
          const apiSecret = process.env.GODADDY_API_SECRET; // Replace with your GoDaddy OTE secret

          const apiUrl = `https://api.ote-godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}&checkType=FULL&forTransfer=false`;

          // Make the request to GoDaddy API
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
          console.log('Domain check data:', data); // Log the response data for debugging
          return res.status(200).json(data);
        } catch (error) {
          console.error("Error fetching domain availability:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        console.log("Serving content for GET request:", contentArray);
        return res.status(200).json({ content: contentArray });
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Helper function to parse the content from the Voiceflow message
function parseContentFromMessage(message) {
  const sections = message.split('\n\n');
  const content = sections.map(section => {
    const lines = section.split('\n');
    const category = lines[0];
    const names = lines.slice(1).map(name => name.trim());
    return { category, names };
  });
  return content;
}
