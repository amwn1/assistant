// namegenpusher.js
import React, { useEffect, useState, useMemo } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content);

      if (data.content && data.content.length > 0) {
        setContent(data.content);
      } else {
        setContent([]);
        setError('No names generated. Describe your Business to the Chatbot');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Error fetching names. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(fetchContent, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredContent = useMemo(() => {
    return content
      .filter(section => section.category !== 'Neutral' || section.names.length > 0)
      .map(section => ({
        ...section,
        names: section.names.filter(name => name.trim() !== '')
      }));
  }, [content]);

  return (
    <div className="vf-container">
      <h2 id="generated-names-title">Generated Names</h2>
      {error && <p className="error-message" role="alert" aria-live="assertive">{error}</p>}
      {loading && <p className="loading-message" role="status" aria-live="polite">Generating names...</p>}
      <div className="response-box" aria-labelledby="generated-names-title">
        {filteredContent.map((section, index) => (
          <div key={index}>
            <h3 id={`category-${index}`}>{section.category}</h3>
            {section.names.length > 0 ? (
              <ul aria-labelledby={`category-${index}`}>
                {section.names.map((name, nameIndex) => (
                  <li key={nameIndex} className="name-item">{name}</li>
                ))}
              </ul>
            ) : (
              <p>No names available for this category</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NameGenPusher;
