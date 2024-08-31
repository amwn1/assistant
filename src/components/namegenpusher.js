const { useState, useEffect } = require('react'); // CommonJS way of importing React hooks

const NameGenPusher = () => {
  const [nameAvailability, setNameAvailability] = useState({});
  
  // Function to check domain availability
  const checkDomainAvailability = async (domain) => {
    try {
      const response = await fetch(`/api/check-domain?domain=${encodeURIComponent(domain)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setNameAvailability(data);
    } catch (error) {
      console.error('Error checking domain availability:', error);
    }
  };

  useEffect(() => {
    // Example usage
    checkDomainAvailability('example.com');
  }, []);

  return (
    <div>
      <h2>Domain Availability</h2>
      {Object.keys(nameAvailability).map(category => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {nameAvailability[category].map(name => (
              <li key={name}>
                <a href={`https://www.godaddy.com/domainsearch/find?domain=${encodeURIComponent(name)}`} 
                   target="_blank" 
                   style={{ textDecoration: nameAvailability[category].includes(name) ? 'underline' : 'none' }}>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default NameGenPusher;
