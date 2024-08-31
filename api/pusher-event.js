// Temporary in-memory storage
let latestMessage = "";

// Function to parse the incoming message and return structured content
function parseContentFromMessage(message) {
  const content = [];
  const categoryRegex = /### (.*?)\n/g; // Match category headings
  const nameRegex = /- \[([^\]]+)\]\(#\)/g; // Match names under categories

  let categoryMatch;
  let lastIndex = 0; // Track the last matched position

  while ((categoryMatch = categoryRegex.exec(message)) !== null) {
    const category = categoryMatch[1].trim();
    const names = [];

    // Capture the section of the message belonging to this category
    const categoryStartIndex = categoryMatch.index;
    const nextCategoryMatch = categoryRegex.exec(message);
    const categorySection = message.slice(
      categoryStartIndex,
      nextCategoryMatch ? nextCategoryMatch.index : message.length
    );

    // Reset name matching for this section
    let nameMatch;
    while ((nameMatch = nameRegex.exec(categorySection)) !== null) {
      names.push(nameMatch[1].trim());
    }

    content.push({ category, names });
    lastIndex = categoryRegex.lastIndex;
  }

  return content;
}

// API handler
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
        if (
          req.headers["content-type"] === "application/x-www-form-urlencoded"
        ) {
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
        console.error(
          "Error parsing request:",
          error,
          "Received body:",
          req.body
        );
        return res.status(400).json({ message: "Invalid request format" });
      }

      const { message } = body;

      if (!message) {
        console.log("No message provided in request body:", body);
        return res
          .status(400)
          .json({ message: "Bad request, no message provided" });
      }

      // Store the latest message in memory
      latestMessage = message;

      return res.status(200).json({ message: "Data received successfully" });
    } else if (req.method === "GET") {
      // Serve the latest message and then clear it
      if (!latestMessage) {
        console.log("No data available for GET request");
        return res.status(404).json({ message: "No data available" });
      }

      console.log("Serving data for GET request:", latestMessage);
      const responseMessage = latestMessage;
      latestMessage = ""; // Clear the memory after serving the data

      // Parse the message to structured content
      const parsedContent = parseContentFromMessage(responseMessage);
      return res.status(200).json({ content: parsedContent });
    } else {
      console.log("Invalid method:", req.method);
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
