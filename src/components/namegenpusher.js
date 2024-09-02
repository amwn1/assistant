import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability
  const [displayNames, setDisplayNames] = useState({}); // State to store names to be displayed after checks

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();

        console.log('Fetched content:', data.content); // Debugging log

        if (data.content && data.content.length > 0) {
          setContent(data.content);
        } else {
          setError('No names generated');
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

  const checkDomainAvailability = async (domain) => {
    // Trim spaces and format domain names correctly
    const formattedDomain = domain.trim().replace(/\s+/g, ''); // Remove spaces entirely
    const domainWithCom = `${formattedDomain}.com`; // Append .com to each domain name
    console.log('Checking domain:', domainWithCom); // Debugging log
    try {
      const response = await fetch(`https://assistant-weld.vercel.app/api/pusher-event?domain=${domainWithCom}`);
      
      if (!response.ok) {
        console.error(`Error fetching domain availability: ${response.status} ${response.statusText}`);
        setAvailability(prev => ({ ...prev, [domain]: false })); // Mark as unavailable if there's an error
        return;
      }

      const data = await response.json();
      console.log('API response for domain:', data); // Debugging log
      
      // Enhanced check for the 'available' key
      if (data && typeof data.available === 'boolean') {
        console.log(`Domain ${domain} availability:`, data.available); // Log the actual availability value
        setAvailability(prev => ({ ...prev, [domain]: data.available })); 
      } else {
        console.warn('Unexpected API response format or missing "available" key:', data);
        setAvailability(prev => ({ ...prev, [domain]: false })); // Default to unavailable if response is not as expected
      }
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setAvailability(prev => ({ ...prev, [domain]: false })); // Mark as unavailable if there's an exception
    }
  };

  useEffect(() => {
    if (content.length > 0) {
      const namesToCheck = [];
      content.forEach(section => {
        section.names.forEach(name => {
          if (!availability.hasOwnProperty(name)) {
            namesToCheck.push(name);
          }
        });
      });

      if (namesToCheck.length > 0) {
        (async () => {
          await Promise.all(namesToCheck.map(name => checkDomainAvailability(name)));
          // Once all checks are complete, set the display names
          const display = {};
          content.forEach(section => {
            display[section.category] = section.names.filter(name => availability[name]);
          });
          setDisplayNames(display);
        })();
      }
    }
  }, [content]);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {Object.keys(displayNames).length > 0 ? (
          content.map((section, index) => (
            <div key={index}>
              <h3>{section.category}</h3>
              {displayNames[section.category] && displayNames[section.category].length > 0 ? (
                displayNames[section.category].map((name, nameIndex) => (
                  <div key={nameIndex}>
                    <a
                      href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name.trim().replace(/\s+/g, ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className='available' // Apply class based on availability
                    >
                      {name}
                    </a>
                    <span style={{ marginLeft: '10px', color: 'green', fontWeight: 'bold' }}>A</span>
                  </div>
                ))
              ) : (
                <p>No names available for this category</p>
              )}
            </div>
          ))
        ) : (
          <p>No names generated</p>
        )}
      </div>
    </div>
  );
};

export default NameGenPusher;
