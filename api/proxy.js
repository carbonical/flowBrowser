// /api/proxy.js
import fetch from 'node-fetch';  // Fetch API to make HTTP requests

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL query parameter is required" });
  }

  try {
    // Fetch the URL passed in the query parameter
    const response = await fetch(url);
    const data = await response.text();

    // Return the content back to the client
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}
