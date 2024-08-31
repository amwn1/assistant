import React, { useEffect, useState } from 'react';
import './namegenpusher.css';

const NameGenPusher = () => {
  const [content, setContent] = useState(''); // State to hold the generated content
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch content from the Vercel function and check domain availability
    const fetchContent = async () => {
      try {
        // Fetch content from your Vercel API endpoint
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();

        // Extract the names and categories
        const { message } = data;
        const parsedContent = await checkDomainAvailability(message);

        setContent(parsedContent); // Set the generated HTML content to state
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
      .replace(/### (.*?)(?=\s*-)/g, '<h3>$1</h3>') // Convert headings
      .replace(/- \[([^\]]+)\]\(#\)/g, (_, name) => {
        // Correctly encode the URL and name
        const encodedName = encodeURIComponent(name.trim());
        return `<a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodedName}" target="_blank" style="${nameAvailability[name] ? 'text-decoration: underline;' : ''}">${name}</a>`;
      }) // Convert markdown links to HTML links
      .replace(/\s*-\s*/g, '<br>'); // Convert bullet points to line breaks
  };

  // Function to check domain availability
  const checkDomainAvailability = async (markdown) => {
    // Extract domain names from the markdown content
    const domainNames = Array.from(new Set(markdown.match(/- \[([^\]]+)\]\(#\)/g)?.map(match => match.replace(/- \[|\]\(#\)/g, '').trim()) || []));
    
    // Perform the domain availability checks
    const availabilityChecks = await Promise.all(domainNames.map(async (name) => {
      const response = await fetch(`https://api.ote-godaddy.com/v1/domains/available?domain=${encodeURIComponent(name)}&checkType=FAST&forTransfer=false`, {
        headers: {
          'accept': 'application/json',
          'Authorization': 'sso-key 3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa:3MLCLyegkYhPjTkUa48qM2'
        }
      });
      const data = await response.json();
      return { name, available: data.available };
    }));

    // Create a map of domain names to their availability status
    const nameAvailability = availabilityChecks.reduce((acc, { name, available }) => {
      acc[name] = available;
      return acc;
    }, {});

    // Replace domain names in the markdown with their availability status
    const updatedMarkdown = markdown.replace(/- \[([^\]]+)\]\(#\)/g, (match, name) => {
      const available = nameAvailability[name];
      return `- [${name}](#)`;
    });

    // Return the parsed and updated HTML content
    return parseContent(updatedMarkdown);
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
