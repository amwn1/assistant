import React, { useEffect, useState, useMemo } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]);

  const fetchContent = async () => {
    try {
      const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched content:', data.content);

      if (Array.isArray(data.content) && data.content.length > 0) {
        setContent(data.content);
      } else {
        setContent([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      // No error message will be shown in the UI
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
