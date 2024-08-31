import React, { useEffect, useState } from 'react';
import "./namegenpusher.css";

const NameGenPusher = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [domainsStatus, setDomainsStatus] = useState({}); // New state to hold domain statuses

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('https://assistant-weld.vercel.app/api/pusher-event');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        const { message } = data;
        const htmlContent = await parseContent(message);
        setContent(htmlContent);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Describe your Business to the Chatbot');
      }
    };

    fetchContent();
    const intervalId = setInterval(fetchContent, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Function to parse the markdown content into HTML
  const parseContent = async (markdown) => {
    if (!markdown) return '<p>No names generated</p>';

    const categories = markdown.split('\n\n').map(category => category.trim()).filter(Boolean);

    const categoryHtml = await Promise.all(categories.map(async (category) => {
      const [header, ...lines] = category.split('\n');
      const categoryName = header.replace(/^###\s/, '').trim();

      const names = lines.map(line => line.replace(/^- \[([^\]]+)\]\(#\)/, '$1')).filter(Boolean);

      const nameLinks = await Promise.all(names.map(async (name) => {
        const response = await fetch('/api/check-domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domain: name }),
        });
        const data = await response.json();
        return {
          name,
          available: data.available
        };
      }));

      return `
        <h3>${categoryName}</h3>
        <ul>
          ${nameLinks.map(({ name, available }) => `
            <li>
              <a href="https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(name)}" 
                 target="_blank" 
                 style="${available ? 'text-decoration: underline;' : ''}">
                ${name}
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    }));

    return categoryHtml.join('');
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
