const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Serve static files (e.g., JS files)
app.use('/js', express.static(path.join(__dirname, 'js')));

// Main endpoint for scraping or proxying
app.get('/api/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers['content-type']);

    const $ = cheerio.load(response.data);

    // Dynamically import the proxyDependencies.js file to check the eruda setting
    const { eruda } = await import('./js/proxyDependencies.js');

    // Scraping and updating relative URLs to use /api/index.js/proxy
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/api/index.js?url=${encodeURIComponent(src)}`);
      }
    });

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', `/api/index.js?url=${encodeURIComponent(href)}`);
      }
    });

    $('video').each((i, el) => {
      const poster = $(el).attr('poster');
      if (poster && !poster.startsWith('http')) {
        $(el).attr('poster', `/api/index.js?url=${encodeURIComponent(poster)}`);
      }

      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/api/index.js?url=${encodeURIComponent(src)}`);
      }
    });

    $('form').each((i, el) => {
      const action = $(el).attr('action');
      if (action && !action.startsWith('http')) {
        $(el).attr('action', `/api/index.js?url=${encodeURIComponent(action)}`);
      }
    });

    // Conditionally append eruda (Dev Console) based on the setting from proxyDependencies.js
    if (eruda) {
      $('body').append(`
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `);
    }

    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Proxying the resource under /api/index.js
app.get('/api/index.js/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    res.send(response.data);

  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
