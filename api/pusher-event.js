import { URLSearchParams } from "url";
import fetch from 'node-fetch'; // Ensure node-fetch is installed for server-side requests

// Temporary in-memory storage for categories and names
let contentArray = [];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://thenameexperts.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
        return res.status(400).json({ message: "Bad request, no message provided" });
      }

      // Parse and store content (categories and names) in the contentArray
      contentArray = parseContentFromMessage(message);

      return res.status(200).json({ message: "Data received and content stored successfully" });
    } else if (req.method === "GET") {
      if (contentArray.length === 0) {
        return res.status(404).json({ message: "No content available" });
      }

      // Check if a domain is requested for availability check
      const { domain } = req.query;
      if (domain) {
        try {
          // GoDaddy OTE API credentials
          const apiKey = '3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa'; // Replace with your GoDaddy OTE key
          const apiSecret = '3MLCLyegkYhPjTkUa48qM2'; // Replace with your GoDaddy OTE secret

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
            return res.status(response.status).json({ message: errorResponse.message });
          }

          const data = await response.json();

          // Extract the 'available' field and domain name
          const isAvailable = data.available || false; // Default to false if 'available' is not defined

          // Send back a minimal response with domain name and availability status
          return res.status(200).json({ domain: data.domain, available: isAvailable });
        } catch (error) {
          return res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        return res.status(200).json({ content: contentArray });
      }
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Function to parse content (categories and names) from the incoming message
function parseContentFromMessage(message) {
  const content = [];
  const categoryRegex = /### (.*?)\n/g;
  const nameRegex = /- \[([^\]]+)\]\(#\)/g;

  let categoryMatch;
  while ((categoryMatch = categoryRegex.exec(message)) !== null) {
    const category = categoryMatch[1].trim();
    const names = [];

    let nameMatch;
    while ((nameMatch = nameRegex.exec(message)) !== null) {
      if (nameRegex.lastIndex > categoryRegex.lastIndex && categoryRegex.lastIndex !== 0) {
        break;
      }
      names.push(nameMatch[1].trim());
    }

    content.push({ category, names });
  }

  return content;
}
