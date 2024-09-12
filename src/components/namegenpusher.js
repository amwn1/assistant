import React, { useEffect, useState, useMemo } from 'react';
import Cookies from 'js-cookie'; // Import js-cookie for managing cookies
import { v4 as uuidv4 } from 'uuid'; // Import UUID to generate unique session IDs
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState([]);
  const [sessionId, setSessionId] = useState('');

  // Function to generate a new session ID
  const generateSessionId = () => {
    return uuidv4();
  };

  // Function to clear session data
  const clearSessionData = () => {
    localStorage.removeItem(`content_${sessionId}`);
  };

  useEffect(() => {
    // Check if a session ID already exists in the cookies
    let existingSessionId = Cookies.get('sessionId');

    if (!existingSessionId) {
      // If no session ID exists, generate a new one and store it in a cookie
      const newSessionId = generateSessionId();
      Cookies.set('sessionId', newSessionId, { expires: 7 }); // Set the cookie to expire in 7 days
      setSessionId(newSessionId);
      console.log('New session ID generated:', newSessionId);
    } else {
      setSessionId(existingSessionId);
      console.log('Existing session ID found:', existingSessionId);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // Fetch content only after the session ID is set
    if (sessionId) {
      // Fetch content immediately on component mount
      fetchContent();

      // Set up an interval to fetch content every 5 seconds
      const intervalId = setInterval(() => {
        fetchContent();
      }, 5000); // Fetch every 5 seconds

      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [sessionId]); // Fetch content when sessionId is set

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
        localStorage.setItem(`content_${sessionId}`, JSON.stringify(data.content));
      } else {
        setContent([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

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
                {section.names.map((name, nameIndex) => {
                  // URL encode the name
                  const encodedName = encodeURIComponent(name.trim());
                  const goDaddyLink = `https://www.godaddy.com/en-in/domainsearch/find?itc=dlp_domain&domainToCheck=${encodedName}`;

                  return (
                    <li key={nameIndex} className="name-item">
                      <a href={goDaddyLink} target="_blank" rel="noopener noreferrer" className="custom-link">
                        {name}
                      </a>
                    </li>
                  );
                })}
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
