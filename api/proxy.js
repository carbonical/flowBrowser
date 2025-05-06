import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

// Enable CORS for all domains
app.use(cors());

// Handle proxy requests
app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        // Optionally set custom headers, like for APIs or User-Agent
      }
    });

    // Return the response from the target URL back to the client
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching the requested URL' });
  }
});

export default app;
