import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold fetched names
  const [error, setError] = useState('');

  // Function to fetch content and store it in state
  const fetchContent = async () => {
    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content); // Log the fetched data for debugging

      if (data.content && data.content.length > 0) {
        setContent(data.content); // Store fetched data in the content state
      } else {
        setContent([]); // Clear content if no names are generated
        setError(''); // Clear error to keep box empty
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Describe your Business to the Chatbot');
    }
  };

  // Use polling to fetch content regularly (every 5 seconds)
  useEffect(() => {
    const intervalId = setInterval(fetchContent, 5000); // Fetch new data every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {content.length > 0 ? (
          content
            .filter(section => section.category !== 'Neutral' || section.names.length > 0) // Remove 'Neutral' if no names
            .map((section, index) => (
              <div key={index}>
                <h3>{section.category}</h3>
                {section.names.length > 0 ? (
                  section.names.map((name, nameIndex) => (
                    <div key={nameIndex} className="name-item">{name}</div>
                  ))
                ) : (
                  <p>No names available for this category</p>
                )}
              </div>
            ))
        ) : (
          null // Empty box if no names are generated
        )}
      </div>
    </div>
  );
};

export default NameGenPusher;
