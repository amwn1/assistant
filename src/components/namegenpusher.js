import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState(''); // State to hold the generated content
  const [error, setError] = useState('');
  const [domainAvailability, setDomainAvailability] = useState({}); // State for domain availability

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

    // Fetch content on component mount
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
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  };

  // Function to parse the markdown content into HTML
  const parseContent = async (markdown) => {
    if (!markdown) return '<p>No names generated</p>';

    const sections = markdown.split('### ').filter(section => section.trim() !== '');
    const results = await Promise.all(sections.map(async (section) => {
      const [categoryName, namesStr] = section.split('\n-').map(part => part.trim());
      const names = namesStr.split('\n').filter(name => name.trim() !== '').map(name => name.trim());
      
      const nameLinks = await Promise.all(names.map(async (name) => {
        const available = await checkDomainAvailability(name);
        return { name, available };
      }));

      return `
        <h3>${categoryName}</h3>
        <ul>
          ${nameLinks.map(({ name, available }) => `
            <li>
              <a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name)}" 
                 target="_blank" 
                 style="${available ? 'text-decoration: underline;' : ''}">
                ${name}
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    }));

    return results.join('');
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
