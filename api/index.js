import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
  // Handle CORS preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Referer');
    return res.status(204).end();
  }

  // Get the URL from the query parameter 'url'
  let { url } = req.query;
  if (!url) {
    return res.status(400).send("Missing `url` query parameter.");
  }

  try {
    // Decode the URL and log it for debugging
    url = decodeURIComponent(url);
    console.log(`Proxying request to: ${url}`);

    // Set up an HTTPS agent (ignore SSL certificate issues)
    const agent = new https.Agent({ rejectUnauthorized: false });

    // Fetch the URL with Axios
    const response = await axios.get(url, {
      httpsAgent: agent,
      responseType: 'arraybuffer', // Default for binary content
      timeout: 30000, // Timeout after 30 seconds
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': '*/*',
      },
    });

    // Get the content type of the response
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // Set the appropriate CORS and content type headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);

    // Remove sensitive headers from the response before passing them through
    const headers = { ...response.headers };
    delete headers['content-security-policy'];
    delete headers['content-security-policy-report-only'];
    delete headers['x-frame-options'];

    // Set headers that can be safely passed through
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    // If the response is binary (image, etc.), send it as a buffer
    if (contentType.includes('image') || contentType.includes('application/octet-stream')) {
      return res.status(response.status).send(Buffer.from(response.data));
    }

    // Otherwise, send the text response (e.g., JSON, HTML, etc.)
    return res.status(response.status).send(response.data);

  } catch (err) {
    console.error(`Proxy Error: ${err.message}`);
    return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
  }
}
