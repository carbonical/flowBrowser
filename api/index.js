const axios = require('axios');

// Handler function for Vercel's serverless function
module.exports = async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the HTML content from the target URL
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
    });

    // Send the raw HTML content as plain text
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="content.txt"');  // This will force download the text file
    res.status(200).send(response.data);

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
