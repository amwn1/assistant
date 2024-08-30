import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        const domainNames = extractDomainNames(data.message);
        checkDomainAvailability(domainNames);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Describe your Business to the Chatbot');
      }
    };

    fetchContent();
    const intervalId = setInterval(fetchContent, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const extractDomainNames = (message) => {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    const names = [];
    while ((match = regex.exec(message)) !== null) {
      names.push(match[1]);
    }
    return names;
  };

  const checkDomainAvailability = async (domainNames) => {
    try {
      const results = await Promise.all(domainNames.map(async (domain) => {
        const response = await fetch(`/api/checkDomainAvailability?domain=${domain}`);
        const data = await response.json();
        return { domain, available: data.available };
      }));

      const availableDomains = results.filter(result => result.available);
      const availableContent = formatAvailableDomains(availableDomains);
      setContent(availableContent);
    } catch (error) {
      console.error('Error checking domain availability:', error);
    }
  };

  const formatAvailableDomains = (domains) => {
    if (domains.length === 0) return '<p>No available names found</p>';
    return domains.map(domain => 
      `<a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domain.domain)}" target="_blank" class="${domain.available ? 'underline' : ''}">${domain.domain}</a>`
    ).join('<br>');
  };

  return (
    <div className="vf-container">
      <h2>Generated Names</h2>
      {error && <p style={{ color: 'cyan' }}>{error}</p>}
      <div className="response-box" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default NameGenPusher;
