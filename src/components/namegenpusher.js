import React, { useEffect, useState, useCallback } from 'react';
import "./namegenpusher.css"; // Ensure your CSS is loaded properly

const NameGenPusher = () => {
  const [content, setContent] = useState([]); // State to hold fetched and filtered names
  const [filteredContent, setFilteredContent] = useState([]); // State to hold filtered content
  const [error, setError] = useState('');

  // Function to fetch content and store it in state
  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content); // Log the fetched data for debugging

      if (data.content && data.content.length > 0) {
        setContent(data.content); // Store fetched data in the content state
        filterContent(data.content); // Filter the content immediately
      } else {
        setContent([]); // Clear content if no names are generated
        setError('No names generated');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Describe your Business to the Chatbot');
    }
  }, []);

  // Function to filter content (adjust the filtering logic as needed)
  const filterContent = (contentArray) => {
    // Example filtering logic (modify as per your needs)
    const filtered = contentArray.filter(section => section.category !== 'Neutral'); // Example: filtering out 'Neutral' category
    setFilteredContent(filtered); // Update the filtered content state
  };

  // Fetch content once when the component mounts
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box">
        {filteredContent.length > 0 ? (
          filteredContent.map((section, index) => (
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
          <p>No names generated</p> // This will keep the box empty if no names are generated
        )}
      </div>
    </div>
  );
};

export default NameGenPusher;
