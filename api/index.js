const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

// Import the proxyUrl from the external file
import { proxyUrl } from './js/proxyDependencies.js'; // Assuming this is the path to proxyDependencies.js

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

    if (contentType.includes('text/html')) {
      const htmlContent = response.data.toString();
      const $ = cheerio.load(htmlContent);

      $('a, img, script, link').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || $el.attr('src');
        
        if (href) {
          const proxiedUrl = `${proxyUrl}/${encodeURIComponent(href)}`;
          if ($el.is('a')) {
            $el.attr('href', proxiedUrl);
          } else {
            $el.attr('src', proxiedUrl);
          }
        }
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send($.html());
    } else if (contentType.includes('image')) {
      res.setHeader('Content-Type', contentType);
      res.send(response.data);
    } else {
      res.status(415).json({ error: 'Unsupported content type' });
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

          if (contentType.includes('text/html')) {
            const htmlContent = await response.text();
            let modifiedHtml = htmlContent.replace(/(href|src)=[\'\"](https?:\/\/[^\s]+)[\'\"]/g, (match, attr, url) => {
              return `${attr}="${proxyUrl}/${encodeURIComponent(url)}"`;
            });

            return new Response(modifiedHtml, {
              headers: { 
                'Content-Type': 'text/html; charset=utf-8', 
                'Access-Control-Allow-Origin': '*' 
              },
            });
          } else if (contentType.includes('image')) {
            return new Response(await response.blob(), {
              headers: { 'Content-Type': contentType },
            });
          } else {
            return new Response('Unsupported content type', { status: 415 });
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

  app.use(cors());

  app.get('/api', proxyRequest);

  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
}
