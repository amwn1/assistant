import React, { useEffect, useState, useCallback } from 'react';
import "./namegenpusher.css";
import VoiceflowChat from './VoiceflowChat'; // Import VoiceflowChat

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability
  const [checkingDomains, setCheckingDomains] = useState([]); // State to hold domains being checked
  const [allChecked, setAllChecked] = useState(false); // State to track if all domains are checked

  // Function to fetch content
  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content); // Debugging log

      if (data.content && data.content.length > 0) {
        // Update content only if it changes
        setContent(prevContent => {
          if (JSON.stringify(prevContent) !== JSON.stringify(data.content)) {
            setAllChecked(false); // Reset the allChecked state
            setAvailability({}); // Reset availability for new data
            return data.content;
          }
          return prevContent; // No change, return the old state
        });
      } else {
        setError('No names generated');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Describe your Business to the Chatbot');
    }
  }, []);

  // Fetch content initially and every 5 seconds
  useEffect(() => {
    fetchContent();

    const intervalId = setInterval(() => {
      fetchContent();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchContent]);

  const handleChatEnd = () => {
    console.log('Chat ended, clearing content...');
    // Clear the content when the chat ends
    setContent([]);
    setError('Chat ended, start a new session');
  };

  // Function to check domain availability
  const checkDomainAvailability = async (name) => {
    const formattedDomain = name.trim().replace(/\s+/g, ''); // Remove spaces entirely
    const domainWithCom = `${formattedDomain}.com`; // Append .com to each domain name
    const encodedDomain = encodeURIComponent(domainWithCom); // Properly encode the domain name
    console.log('Checking domain:', encodedDomain); // Debugging log
    try {
      const response = await fetch(`https://assistant-weld.vercel.app/api/pusher-event?domain=${encodedDomain}`);
      if (!response.ok) {
        console.error(`Error fetching domain availability: ${response.status} ${response.statusText}`);
        return false;
      }
      const data = await response.json();
      if (data && typeof data.available === 'boolean') {
        return data.available;
      }
      return false;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  };

  // Function to sequentially check all domains after content updates
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

      const checkAllDomainsSequentially = async (names) => {
        const availabilityResults = {};
        for (let name of names) {
          const isAvailable = await checkDomainAvailability(name);
          availabilityResults[name] = isAvailable;
        }
        setAvailability(availabilityResults); // Set all results at once to minimize re-renders
        setAllChecked(true);
      };

      checkAllDomainsSequentially(namesToCheck);
    }
  }, [content, availability, allChecked]);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {content.length > 0 ? (
          content
            .map((section, index) => (
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
      {/* Add VoiceflowChat component and pass handleChatEnd to clear content when the chat ends */}
      <VoiceflowChat onChatEnd={handleChatEnd} />
    </div>
  );
};

export default NameGenPusher;
