import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
  // Handle preflight requests (CORS OPTIONS request)
  if (req.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");
    return res.status(204).end();
  }

  // Get the URL from query parameters
  let { url } = req.query;
  if (!url) {
    return res.status(400).send("Missing `url` query parameter.");
  }

  try {
    // Decode the URL
    url = decodeURIComponent(url);
    console.log(`Proxying: ${url}`);

    // Set up the HTTPS agent (ignore SSL errors)
    const agent = new https.Agent({ rejectUnauthorized: false });

    // Make the request to the target URL
    const response = await axios.get(url, {
      httpsAgent: agent,
      responseType: 'arraybuffer', // Default for binary responses
      timeout: 30000,
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': '*/*',
      },
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Set CORS headers so this can be accessed cross-origin
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Content-Type", contentType);

    // Send the response data as is from the proxy
    return res.status(response.status).send(Buffer.from(response.data));

  } catch (err) {
    console.error(`Proxy Error: ${err.message}`);
    return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
  }
}
