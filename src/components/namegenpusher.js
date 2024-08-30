import React, { useEffect, useState } from 'react';
import './namegenpusher.css';

const NameGenPusher = () => {
  const [content, setContent] = useState(''); // State to hold content as HTML
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch content from the Vercel function
    const fetchContent = async () => {
      try {
        const response = await fetch('https://voiceflow-namegenerator.vercel.app/api/pusher-event'); // Use your Vercel endpoint
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json(); // Fetch response as JSON
        const markdownContent = data.message; // Extract message from JSON
        const htmlContent = convertMarkdownToHTML(markdownContent); // Convert markdown to HTML
        setContent(htmlContent); // Set the converted HTML content to state
        checkDomainAvailability(htmlContent); // Check domain availability
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to fetch data');
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

  // Function to convert markdown to HTML and replace links
  const convertMarkdownToHTML = (markdown) => {
    return markdown
      .replace(/### (.*?)\n/g, '<h3>$1</h3>') // Convert markdown headers
      .replace(/\[(.*?)\]\(#\)/g, (match, p1) => {
        const nameForLink = p1.replace(/ /g, '+'); // Replace spaces with '+'
        return `<a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${nameForLink}" target="_blank">${p1}</a>`;
      }) // Replace # with GoDaddy link
      .replace(/\n/g, '<br>'); // Convert newlines to <br>
  };

  // Function to check domain availability
  const checkDomainAvailability = async (htmlContent) => {
    const domainNames = Array.from(htmlContent.matchAll(/domainToCheck=([^"]+)/g), m => m[1].replace(/\+/g, ' '));
    
    for (let domain of domainNames) {
      try {
        const response = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
          method: 'GET',
          headers: {
            Authorization: `sso-key YOUR_API_KEY:YOUR_API_SECRET`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log(`Domain ${domain} is ${data.available ? 'available' : 'not available'}`);
      } catch (error) {
        console.error('Error checking domain availability:', error);
      }
    }
  };

  return (
    <div className="vf-container">
      <h2>Generated Name</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* Render the dynamic HTML content */}
      <div className="response-box" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default NameGenPusher;