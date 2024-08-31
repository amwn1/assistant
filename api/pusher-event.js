import React, { useEffect, useState } from 'react';
import './namegenpusher.css';

const NameGenPusher = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [domainAvailability, setDomainAvailability] = useState({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        const htmlContent = parseContent(data.message);
        setContent(htmlContent);

        // Extract domain names for checking availability
        const domainNames = extractDomainNames(data.message);
        if (domainNames.length > 0) {
          checkDomainAvailability(domainNames);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Describe your Business to the Chatbot');
      }
    };

    fetchContent();
    const intervalId = setInterval(() => {
      fetchContent();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Extract domain names from content
  const extractDomainNames = (markdown) => {
    const regex = /\[([^\]]+)\]\(#\)/g;
    let match;
    const domains = [];
    while ((match = regex.exec(markdown)) !== null) {
      domains.push(match[1]);
    }
    return domains;
  };

  // Check domain availability
  const checkDomainAvailability = async (domainNames) => {
    const apiKey = 'your-godaddy-api-key';
    const apiSecret = 'your-godaddy-api-secret';

    try {
      const availability = await Promise.all(
        domainNames.map(async (domain) => {
          const response = await fetch(
            `https://api.ote-godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST&forTransfer=false`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `sso-key 3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa:3MLCLyegkYhPjTkUa48qM2`,
              },
            }
          );
          const data = await response.json();
          return { domain, available: data.available };
        })
      );

      // Map availability to domain names
      const availabilityMap = availability.reduce((acc, { domain, available }) => {
        acc[domain] = available;
        return acc;
      }, {});

      setDomainAvailability(availabilityMap);
    } catch (error) {
      console.error('Error checking domain availability:', error);
    }
  };

  // Parse markdown content to HTML
  const parseContent = (markdown) => {
    if (!markdown) return '<p>No names generated</p>';

    // Regular expression to match categories and names
    const categoryRegex = /### (.*?)\n([\s\S]*?)(?=\n###|\n$)/g;
    const categoryMatches = [...markdown.matchAll(categoryRegex)];

    // Map categories to names
    const categories = categoryMatches.map(([_, categoryName, names]) => {
      const nameRegex = /- \[([^\]]+)\]\(#\)/g;
      const nameMatches = [...names.matchAll(nameRegex)];
      const nameLinks = nameMatches.map(([_, name]) => ({
        name,
        available: domainAvailability[name] !== undefined ? domainAvailability[name] : null,
      }));

      return {
        categoryName,
        nameLinks,
      };
    });

    return categories
      .map(({ categoryName, nameLinks }) => `
        <h3>${categoryName}</h3>
        <ul>
          ${nameLinks.map(({ name, available }) => `
            <li>
              <a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name)}" 
                 target="_blank" 
                 style="${available === true ? 'text-decoration: underline;' : available === false ? 'text-decoration: none;' : ''}">
                ${name}
              </a>
            </li>
          `).join('')}
        </ul>
      `)
      .join('');
  };

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default NameGenPusher;
