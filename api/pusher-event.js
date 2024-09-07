import { URLSearchParams } from "url";
import fetch from "node-fetch"; // Ensure you import fetch if using in a Node.js environment

// Temporary in-memory storage for categories and names
let contentArray = [];
let isProcessing = false; // Lock to prevent multiple requests at the same time

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
    if (isProcessing) {
      return res.status(429).json({ message: "Server is busy processing another request. Try again later." });
    }

    isProcessing = true; // Lock the process

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
        isProcessing = false; // Release the lock
        return res.status(400).json({ message: "Invalid request format" });
      }

      const { message } = body;

      if (!message) {
        console.log("No message provided in request body:", body);
        isProcessing = false; // Release the lock
        return res.status(400).json({ message: "Bad request, no message provided" });
      }

      // Parse and store content (categories and names) in the contentArray
      contentArray = parseContentFromMessage(message);

      // After names are parsed, check domain availability for each name sequentially
      const availabilityResults = await checkAllDomainsSequentially(contentArray);

      isProcessing = false; // Release the lock
      return res.status(200).json({ message: "Data received and processed", availabilityResults });
    } else if (req.method === "GET") {
      if (contentArray.length === 0) {
        console.log("No content available for GET request");
        isProcessing = false; // Release the lock
        return res.status(404).json({ message: "No content available" });
      }

      const { domain } = req.query;
      if (domain) {
        try {
          const availabilityData = await checkDomainAvailability(domain);
          isProcessing = false; // Release the lock
          return res.status(200).json(availabilityData);
        } catch (error) {
          console.error("Error fetching domain availability:", error);
          isProcessing = false; // Release the lock
          return res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        console.log("Serving content for GET request:", contentArray);
        isProcessing = false; // Release the lock
        return res.status(200).json({ content: contentArray });
      }
    } else {
      console.log("Invalid method:", req.method);
      isProcessing = false; // Release the lock
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    isProcessing = false; // Release the lock
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

// Function to check domain availability
async function checkDomainAvailability(domain) {
  try {
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
      return { domain, available: false, error: errorResponse.message };
    }

    const data = await response.json();
    return { domain: data.domain, available: data.available };
  } catch (error) {
    console.error("Error fetching domain availability:", error);
    return { domain, available: false, error: "Internal Server Error" };
  }
}

// Function to check all domains sequentially
async function checkAllDomainsSequentially(content) {
  const availabilityResults = [];

  // Iterate through each category and its names
  for (const section of content) {
    for (const name of section.names) {
      const formattedDomain = `${name.replace(/\s+/g, '')}.com`; // Prepare the domain for checking
      const result = await checkDomainAvailability(formattedDomain); // Check domain availability
      availabilityResults.push(result); // Store the result
    }
  }

  return availabilityResults;
}
