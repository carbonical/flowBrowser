const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const { eruda } = require('../js/proxyDependencies'); // Adjust this import based on your setup

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Pre-flight request handling (CORS)
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Serve static JS files from the 'js' directory
app.use('/js', express.static(path.join(__dirname, 'js')));

// Proxy the HTML content from the target URL and update all links/paths
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

    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers['content-type']);

    // Load HTML with cheerio
    const $ = cheerio.load(response.data);

    // Define the base proxy URL for relative paths
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/index.js?url=${encodeURIComponent(targetUrl)}`;

    // Loop through all the relevant HTML elements and update their URLs
    $('a, img, video, form, link[rel="stylesheet"], script[src], link[rel="icon"], link[rel="apple-touch-icon"]').each((i, el) => {
      const tagName = el.tagName.toLowerCase();
      let src, href, action, poster;

      // Update anchor tags (links)
      if (tagName === 'a') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', `${proxyUrl}${encodeURIComponent(href)}`);
        }
      } 
      
      // Update image tags
      else if (tagName === 'img') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${proxyUrl}${encodeURIComponent(src)}`);
        }
      } 
      
      // Update video tags (both src and poster)
      else if (tagName === 'video') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${proxyUrl}${encodeURIComponent(src)}`);
        }

        poster = $(el).attr('poster');
        if (poster && !poster.startsWith('http')) {
          $(el).attr('poster', `${proxyUrl}${encodeURIComponent(poster)}`);
        }
      }
      
      // Update form action
      else if (tagName === 'form') {
        action = $(el).attr('action');
        if (action && !action.startsWith('http')) {
          $(el).attr('action', `${proxyUrl}${encodeURIComponent(action)}`);
        }
      }
      
      // Update link tags (stylesheet, icon)
      else if (tagName === 'link') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', `${proxyUrl}${encodeURIComponent(href)}`);
        }
      } 
      
      // Update script tags
      else if (tagName === 'script') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${proxyUrl}${encodeURIComponent(src)}`);
        }
      }
    });

    // Inject Eruda (if available) for debugging
    if (eruda) {
      $('body').append(`
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `);
    }

    // Send the updated HTML back as the response
    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Proxy the resources (scripts, images, etc.) from the target URL
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

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    res.send(response.data);

  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
