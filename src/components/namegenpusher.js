import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [names, setNames] = useState([]); // State to hold the names
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch names from the Vercel function
    const fetchNames = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event'); // Update with your actual server URL
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json(); // Fetch response as JSON

        if (data.names && data.names.length > 0) {
          setNames(data.names); // Set the fetched names to state
        } else {
          setError('No names available');
        }
      } catch (error) {
        console.error('Error fetching names:', error);
        setError('Describe your Business to the Chatbot');
      }
    };

    // Initial fetch
    fetchNames();

    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchNames();
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {names.length > 0 ? (
          names.map((name, index) => (
            <div key={index}>
              <a href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
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
