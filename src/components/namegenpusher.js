import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability
  const [checkingDomains, setCheckingDomains] = useState([]); // State to hold domains being checked
  const [allChecked, setAllChecked] = useState(false); // State to track if all domains are checked

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

  const checkDomainAvailability = async (name, retries = 3) => {
    const formattedDomain = name.trim().replace(/\s+/g, ''); // Remove spaces entirely
    const domainWithCom = `${formattedDomain}.com`; // Append .com to each domain name
    const encodedDomain = encodeURIComponent(domainWithCom); // Properly encode the domain name
    console.log('Checking domain:', encodedDomain); // Debugging log

    try {
      const response = await fetch(`https://assistant-weld.vercel.app/api/pusher-event?domain=${encodedDomain}`);
      
      if (!response.ok) {
        console.error(`Error fetching domain availability: ${response.status} ${response.statusText}`);
        
        if (response.status === 404 && retries > 0) {
          console.log(`Retrying domain check for ${encodedDomain}...`);
          return await checkDomainAvailability(name, retries - 1); // Retry on 404 error
        }

        return false; // Return false if there's an error after retries
      }

      const data = await response.json();
      console.log('API response for domain:', data); // Debugging log

      if (data && typeof data.available === 'boolean') {
        console.log(`Domain ${data.domain} availability:`, data.available); // Log the actual availability value
        return data.available;
      } else {
        console.warn('Unexpected API response format or missing "available" key:', data);
        return false; // Default to unavailable if response is not as expected
      }
    } catch (error) {
      console.error('Error checking domain availability:', error);
      
      if (retries > 0) {
        console.log(`Retrying domain check for ${encodedDomain} due to network error...`);
        return await checkDomainAvailability(name, retries - 1); // Retry on network error
      }

      return false; // Return false if there's an exception after retries
    }
  };

  const checkAllDomainsSequentially = async (names) => {
    for (let name of names) {
      if (!availability.hasOwnProperty(name)) {
        const isAvailable = await checkDomainAvailability(name);
        setAvailability(prev => ({ ...prev, [name]: isAvailable }));
      }
    }
    setAllChecked(true);
    console.log('Completed all domain checks.'); // Debugging log

    // Reload the page once all domains have been checked
    window.location.reload();
  };

  useEffect(() => {
    if (content.length > 0 && !allChecked) {
      const namesToCheck = [];
      content.forEach(section => {
        section.names.forEach(name => {
          if (!availability.hasOwnProperty(name)) {
            namesToCheck.push(name);
          }
        });
      });

      if (namesToCheck.length > 0) {
        setCheckingDomains(namesToCheck);
      }
    }
  }, [content, allChecked]);

  useEffect(() => {
    if (checkingDomains.length > 0 && !allChecked) {
      checkAllDomainsSequentially(checkingDomains);
    }
  }, [checkingDomains, allChecked]);

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
                  <div key={nameIndex}>
                    <a
                      href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name.trim().replace(/\s+/g, ''))}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={availability[name] ? 'available' : 'not-available'} // Apply class based on availability
                    >
                      {name}
                    </a>
                    <span style={{ marginLeft: '10px', color: availability[name] ? 'green' : 'red', fontWeight: 'bold' }}>
                      {availability[name] ? 'A' : 'NA'}
                    </span>
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
