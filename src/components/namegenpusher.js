import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState(''); // State to hold the generated content
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch content from the Vercel function
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event'); // Update with your actual server URL
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json(); // Fetch response as JSON
        const htmlContent = parseContent(data.message); // Parse the markdown content
        setContent(htmlContent); // Set the generated HTML content to state
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Describe your Business to the Chatbot');
      }
    };

    // Initial fetch
    fetchContent();
// Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchContent();
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to parse the markdown content into HTML
  const parseContent = (markdown) => {
    if (!markdown) return '<p>No names generated</p>';

    // Replace markdown headings and links with HTML equivalents
    return markdown
      .replace(/### (.?)(?=\s-)/g, '<h3>$1</h3>') // Convert headings
      .replace(/- [([^]]+)](([^)]+))/g, (_, name, url) => {
        // Correctly encode the URL and name
        const encodedName = encodeURIComponent(name.trim());
        return <a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodedName}" target="_blank">${name}</a>;
      }) // Convert markdown links to HTML links
      .replace(/\s-\s/g, '<br>'); // Convert bullet points to line breaks
  };

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      {/* Render the dynamic HTML content */}
      <div className="response-box" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default NameGenPusher;