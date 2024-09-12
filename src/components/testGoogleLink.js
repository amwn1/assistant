import React from 'react';

const TestGoogleLink = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Google Link</h1>
      <p>Click the link below to open Google in the browser:</p>
      <a
        href="https://www.google.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'blue', textDecoration: 'underline', fontSize: '18px' }}
      >
        Open Google
      </a>
    </div>
  );
};

export default TestGoogleLink;
