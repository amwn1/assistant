import React, { useEffect, useState } from 'react';
import './namegenpusher.css';
// GoDaddy API credentials (Replace these with your actual credentials)
const GODADDY_API_KEY = '3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa';
const GODADDY_API_SECRET = '3MLCLyegkYhPjTkUa48qM2';

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold parsed content
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch content from the Vercel function
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/'); // Use your Vercel endpoint
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json(); // Fetch response as JSON
        const markdownContent = data.message; // Extract message from JSON
        const parsedContent = parseMarkdownToLinks(markdownContent); // Convert markdown to array of objects with GoDaddy links
        setContent(parsedContent); // Set the parsed content to state
        checkDomainAvailability(parsedContent); // Check domain availability
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

  // Function to parse markdown and generate GoDaddy links
  const parseMarkdownToLinks = (markdown) => {
    const lines = markdown.split('\n');
    const parsedContent = [];
    let currentCategory = '';

    lines.forEach(line => {
      if (line.startsWith('###')) {
        currentCategory = line.replace('###', '').trim();
        parsedContent.push({ category: currentCategory, names: [] });
      } else if (line.startsWith('[')) {
        const nameMatch = line.match(/\[(.*?)\]/);
        if (nameMatch) {
          const name = nameMatch[1];
          const link = `https://www.godaddy.com/domainsearch/find?domainToCheck=${name.replace(/ /g, '+')}`;
          parsedContent[parsedContent.length - 1].names.push({ name, link, available: null });
        }
      }
    });

    return parsedContent;
  };

  // Function to check domain availability using GoDaddy API
  const checkDomainAvailability = async (parsedContent) => {
    const requests = parsedContent.flatMap(category =>
      category.names.map(nameObj => {
        return fetch(`https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(nameObj.name)}.com`, {
          method: 'GET',
          headers: {
            'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(data => {
            nameObj.available = data.available;
            setContent([...parsedContent]); // Update state with new availability
          })
          .catch(err => {
            console.error('Error checking domain availability:', err);
          });
      })
    );

    await Promise.all(requests);
  };

  return (
    <div className="vf-container">
      <h2>Generated Name</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* Render the dynamic HTML content */}
      <div className="response-box">
        {content.map((category, index) => (
          <div key={index}>
            <h3>{category.category}</h3>
            <ul>
              {category.names.map((nameObj, i) => (
                <li key={i}>
                  <a href={nameObj.link} target="_blank" rel="noopener noreferrer">
                    {nameObj.name}
                  </a>
                  {nameObj.available === null ? (
                    ' (Checking...)'
                  ) : nameObj.available ? (
                    ' (Available)'
                  ) : (
                    ' (Not Available)'
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NameGenPusher;