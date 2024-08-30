import React, { useEffect, useState } from 'react';
import './namegenpusher.css';
// Function to check domain availability using GoDaddy API
const checkDomainAvailability = async (domain) => {
  const apiKey = '3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa'; // Replace with your GoDaddy API key
  const apiSecret = '3MLCLyegkYhPjTkUa48qM2'; // Replace with your GoDaddy API secret

  try {
    const response = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return false;
  }
};

const NameGenPusher = () => {
  const [content, setContent] = useState(''); // State to hold content as HTML
  const [availableDomains, setAvailableDomains] = useState([]); // State to hold available domain names
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
        const namesArray = extractNames(markdownContent); // Extract names from the markdown content
        const availableNames = await checkDomains(namesArray); // Check domain availability
        setAvailableDomains(availableNames); // Set available domains to state
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to fetch data');
      }
    };

    fetchContent();
  }, []);

  // Function to extract names from the markdown content
  const extractNames = (markdown) => {
    const names = [];
    const regex = /\[(.*?)\]\(#\)/g; // Matches any text inside brackets followed by (#)
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      names.push(match[1]); // Extract the name inside the brackets
    }
    return names;
  };

  // Function to check domain availability for an array of names
  const checkDomains = async (names) => {
    const available = [];
    for (let name of names) {
      const domainName = `${name.replace(/\s+/g, '')}.com`; // Convert name to a potential domain (e.g., 'Mighty Bananas' to 'MightyBananas.com')
      const isAvailable = await checkDomainAvailability(domainName);
      if (isAvailable) {
        available.push({ name, domainName });
      }
    }
    return available;
  };

  return (
    <div className="vf-container">
      <h2>Generated Name</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="response-box">
        {availableDomains.length > 0 ? (
          availableDomains.map(({ name, domainName }) => (
            <p key={domainName}>
              {name} - <a href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${domainName}`} target="_blank" rel="noopener noreferrer">{domainName}</a>
            </p>
          ))
        ) : (
          <p>No available domains found yet.</p>
        )}
      </div>
    </div>
  );
};

export default NameGenPusher;