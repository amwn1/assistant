import { URLSearchParams } from "url";

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

      // Serve the stored content without domain availability checks
      console.log("Serving content for GET request:", contentArray);
      return res.status(200).json({ content: contentArray });
    } else {
      console.log("Invalid method:", req.method);
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
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
