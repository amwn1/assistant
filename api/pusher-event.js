import { URLSearchParams } from "url";

// Temporary in-memory storage for names
let namesArray = [];

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
          // Parse x-www-form-urlencoded data
          body = Object.fromEntries(new URLSearchParams(req.body));
        } else {
          // Fallback to JSON parsing
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

      // Parse and store names in the namesArray
      const parsedNames = parseNamesFromMessage(message);
      namesArray = [...namesArray, ...parsedNames];

      return res.status(200).json({ message: "Data received and names stored successfully" });
    } else if (req.method === "GET") {
      if (namesArray.length === 0) {
        console.log("No names available for GET request");
        return res.status(404).json({ message: "No names available" });
      }

      console.log("Serving names for GET request:", namesArray);
      return res.status(200).json({ names: namesArray });
    } else {
      console.log("Invalid method:", req.method);
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Function to parse names from the incoming message
function parseNamesFromMessage(message) {
  const nameRegex = /- \[([^\]]+)\]\(#\)/g;
  let match;
  const names = [];

  // Extract all names that match the regex
  while ((match = nameRegex.exec(message)) !== null) {
    names.push(match[1].trim());
  }

  return names;
}
