export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { domain } = req.body;
  
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }
  
  
      try {
        const response = await fetch(`https://api.ote-godaddy.com/v1/domains/available?domain=${domain}`, {
          method: 'GET',
          headers: {
            'Authorization': `sso-key ${"3mM44UdC6xxj75_9MYpwv6Fi6btzzdCc6oQLa"}:${"3MLCLyegkYhPjTkUa48qM2"}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error(`Error fetching domain availability: ${response.statusText}`);
        }
  
        const data = await response.json();
        res.status(200).json(data);
      } catch (error) {
        console.error('Error checking domain availability:', error);
        res.status(500).json({ error: 'Error checking domain availability' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  }
  