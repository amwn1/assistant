import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();

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
    const domainWithCom = `${domain}.com`; // Append .com to each domain name
    try {
      const response = await fetch(`https://assistant-weld.vercel.app/api/pusher-event?domain=${domainWithCom}`);
      if (!response.ok) {
        throw new Error(`Error fetching domain availability: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Directly use the 'available' field in the response
      setAvailability(prev => ({ ...prev, [domain]: data.available })); 
    } catch (error) {
      console.error('Error checking domain availability:', error);
    }
  };

  useEffect(() => {
    if (content.length > 0) {
      content.forEach(section => {
        section.names.forEach(name => {
          if (!availability.hasOwnProperty(name)) {
            checkDomainAvailability(name); // Only check availability for names
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
                        href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name)}`}
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
