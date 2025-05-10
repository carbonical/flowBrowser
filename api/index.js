const axios = require('axios');

const proxyRequest = async (req, res) => {
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
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// For Vercel: Serverless function
if (typeof process.env.VERCEL !== 'undefined') {
  module.exports = proxyRequest;
}
// For Cloudflare Pages: Cloudflare Worker
else if (typeof process.env.CF_PAGES !== 'undefined') {
  addEventListener('fetch', event => {
    event.respondWith(
      (async () => {
        const url = new URL(event.request.url);
        const targetUrl = url.searchParams.get('url');

        if (!targetUrl) {
          return new Response('Missing URL parameter', { status: 400 });
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'text/html',
            },
          });

          const html = await response.text();
          return new Response(html, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        } catch (error) {
          console.error('Error proxying resource:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      })()
    );
  });
}
// For Render: Express Server
else {
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/api', proxyRequest);

  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
}
