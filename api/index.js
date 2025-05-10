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
        'Accept': 'text/html,image/*,*/*',
      },
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (contentType.includes('image')) {
      res.setHeader('Content-Type', contentType);
      res.send(response.data);
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(response.data.toString());
    }
  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

if (typeof process.env.VERCEL !== 'undefined') {
  module.exports = proxyRequest;
} else if (typeof process.env.CF_PAGES !== 'undefined') {
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
              'Accept': 'text/html,image/*,*/*',
            },
          });

          const contentType = response.headers.get('content-type');

          const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };

          if (contentType.includes('image')) {
            return new Response(await response.blob(), {
              headers: { 
                'Content-Type': contentType, 
                ...corsHeaders 
              },
            });
          } else {
            const html = await response.text();
            return new Response(html, {
              headers: { 
                'Content-Type': 'text/html; charset=utf-8', 
                ...corsHeaders 
              },
            });
          }
        } catch (error) {
          console.error('Error proxying resource:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      })()
    );
  });
} else {
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/api', proxyRequest);

  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
}
