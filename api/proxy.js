const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const app = express();

app.use(cors());

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.get('/search', async (req, res) => {
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

    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/search?url=${encodeURIComponent(src)}`);
      }
    });

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', `/search?url=${encodeURIComponent(href)}`);
      }
    });

    $('video').each((i, el) => {
      const poster = $(el).attr('poster');
      if (poster && !poster.startsWith('http')) {
        $(el).attr('poster', `/search?url=${encodeURIComponent(poster)}`);
      }

      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', `/search?url=${encodeURIComponent(src)}`);
      }
    });

    $('form').each((i, el) => {
      const action = $(el).attr('action');
      if (action && !action.startsWith('http')) {
        $(el).attr('action', `/search?url=${encodeURIComponent(action)}`);
      }
    });

    $('body').append(`
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
    `);

    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;
