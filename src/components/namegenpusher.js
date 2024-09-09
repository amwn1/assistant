import React, { useEffect, useState, useCallback } from 'react';
import "./namegenpusher.css";
import VoiceflowChat from './VoiceflowChat'; // Import VoiceflowChat

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold the categories and names
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({}); // State to hold domain availability
  const [loading, setLoading] = useState(false); // State to track if domains are being checked
  const [allChecked, setAllChecked] = useState(false); // State to track if all domains are checked
  const [isFetched, setIsFetched] = useState(false); // New state to track if content is already fetched

  // Function to fetch content only once
  const fetchContentOnce = useCallback(async () => {
    if (isFetched) return; // Skip if already fetched

    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content); // Debugging log

      if (data.content && data.content.length > 0) {
        setContent(data.content);
        setAllChecked(false); // Reset the allChecked state
        setAvailability({}); // Reset availability for new data
        setIsFetched(true); // Mark the content as fetched
      } else {
        setError('No names generated');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Describe your Business to the Chatbot');
    }
  }, [isFetched]);

  // Fetch content only once after the component mounts
  useEffect(() => {
    fetchContentOnce();
  }, [fetchContentOnce]);

  const handleChatEnd = () => {
    console.log('Chat ended, clearing content...');
    // Clear the content when the chat ends
    setContent([]);
    setError('Chat ended, start a new session');
    setIsFetched(false); // Allow fetching again if the chat restarts
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
        setError(`Error checking domain: ${response.status} ${response.statusText}`);
        return false;
      }
      const data = await response.json();
      if (data && typeof data.available === 'boolean') {
        return data.available;
      }
      return false;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      setError('Error checking domain availability');
      return false;
    }
  };

  // Function to check all domains in batches
  const BATCH_SIZE = 5; // Number of domains to check at a time
  const BATCH_DELAY = 2000; // 2 seconds delay between batches

  const checkAllDomainsInBatches = async (names) => {
    setLoading(true); // Set loading to true
    let availabilityResults = {};

    for (let i = 0; i < names.length; i += BATCH_SIZE) {
      const batch = names.slice(i, i + BATCH_SIZE);

      // Process each batch
      const batchResults = await Promise.all(
        batch.map(async (name) => {
          const isAvailable = await checkDomainAvailability(name);
          return { name, isAvailable };
        })
      );

      // Merge batch results with the existing results
      availabilityResults = batchResults.reduce((acc, { name, isAvailable }) => {
        acc[name] = isAvailable;
        return acc;
      }, availabilityResults);

      setAvailability((prevAvailability) => ({
        ...prevAvailability,
        ...availabilityResults,
      }));

      // Delay before processing the next batch
      if (i + BATCH_SIZE < names.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    setLoading(false); // Set loading to false after checking
    setAllChecked(true);
  };

  // Sequentially check all domains after content updates
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
        checkAllDomainsInBatches(namesToCheck);
      }
    }
  }, [content, availability, allChecked]);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      {loading && <p>Checking domain availability...</p>} {/* Show loading message */}
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
      {/* Add VoiceflowChat component and pass handleChatEnd to clear content when the chat ends */}
      <VoiceflowChat onChatEnd={handleChatEnd} />
    </div>
  );
};

export default NameGenPusher;
