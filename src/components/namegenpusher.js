import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability
  const [checkedDomains, setCheckedDomains] = useState(new Set()); // State to track checked domains

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
  }, []);

  const checkDomainAvailability = async (domain) => {
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

      if (data && typeof data.available === 'boolean') {
        console.log(`Domain ${domain} availability:`, data.available); // Log the actual availability value
        setAvailability(prev => ({ ...prev, [domain]: data.available })); 
      } else {
        console.warn('Unexpected API response format or missing "available" key:', data);
        setAvailability(prev => ({ ...prev, [domain]: false })); // Default to unavailable if response is not as expected
      }

      console.log('Updated availability state:', availability); // Debugging log
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setAvailability(prev => ({ ...prev, [domain]: false })); // Mark as unavailable if there's an exception
    }
  };

  useEffect(() => {
    if (content.length > 0) {
      content.forEach(section => {
        section.names.forEach(name => {
          if (!checkedDomains.has(name) && !availability.hasOwnProperty(name)) {
            checkDomainAvailability(name); // Check availability for each name
            setCheckedDomains(prev => new Set(prev).add(name)); // Add to checked domains
          }
        });
      });
    }
  }, [content]);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {content.length > 0 ? (
          content.map((section, index) => (
            <div key={index}>
              <h3>{section.category}</h3>
              {section.names.length > 0 ? (
                section.names.map((name, nameIndex) => (
                  availability[name] ? ( // Only render available names
                    <div key={nameIndex}>
                      <a
                        href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name.trim().replace(/\s+/g, ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className='available' // Apply class based on availability
                      >
                        {name}
                      </a>
                      <span style={{ marginLeft: '10px', color: 'green' }}>Available</span>
                    </div>
                  ) : null // Do not render if not available
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
