import express from 'express';
import axios from 'axios';
import https from 'https';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to handle preflight CORS requests (OPTIONS)
app.options('*', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, Referer");
  res.status(204).end();
});

// Proxy endpoint
app.get('/proxy', async (req, res) => {
  let { url } = req.query;
  if (!url) return res.status(400).send("Missing `url` query parameter.");

  try {
    url = decodeURIComponent(url);
    console.log(`Proxying: ${url}`);

    const agent = new https.Agent({ rejectUnauthorized: false });

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    const isBinary = /\.(woff2?|ttf|eot|otf|ico)$/i.test(url);
    const isJson = /\.json$/i.test(url);
    const isJs = /\.js$/i.test(url);

    const response = await axios.get(url, {
      httpsAgent: agent,
      responseType: isImage || isBinary ? 'arraybuffer' : 'text',
      timeout: 30000,
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': '*/*',
      },
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);

    if (isImage || isBinary) {
      return res.status(response.status).send(Buffer.from(response.data));
    }

    if (isJson) {
      return res.status(response.status).json(response.data);
    }

    // For other types (e.g., text/html, text/plain), send the raw response
    return res.status(response.status).send(response.data);

  } catch (err) {
    console.error(`Proxy Error: ${err.message}`);
    return res.status(500).send(`<h1>Proxy Error</h1><p>${err.message}</p>`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
