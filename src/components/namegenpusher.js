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
        const htmlContent = await parseContent(data.message); // Parse the markdown content
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

  // Function to check domain availability
  const checkDomainAvailability = async (domain) => {
    try {
      const response = await fetch(`/api/check-domain?domain=${encodeURIComponent(domain)}`);
      const result = await response.json();
      return result.available;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  };

  // Function to parse the markdown content into HTML
  const parseContent = async (markdown) => {
    if (!markdown) return '<p>No names generated</p>';

    const linkRegex = /- \[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    const promises = [];

    while ((match = linkRegex.exec(markdown)) !== null) {
      const name = match[1];
      const url = match[2];
      const encodedName = encodeURIComponent(name.trim());

      promises.push(
        checkDomainAvailability(encodedName).then(isAvailable => {
          const availabilityClass = isAvailable ? 'available' : 'unavailable';
          return `<a href="https://www.godaddy.com/en-in/domainsearch/find?domainToCheck=${encodedName}" class="${availabilityClass}" target="_blank">${name}</a>`;
        })
      );
    }

    const links = await Promise.all(promises);
    let index = 0;

    return markdown
      .replace(/### (.*?)(?=\s*-)/g, '<h3>$1</h3>') // Convert headings
      .replace(linkRegex, () => {
        return links[index++];
      }) // Insert links with availability check
      .replace(/\s*-\s*/g, '<br>'); // Convert bullet points to line breaks
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
