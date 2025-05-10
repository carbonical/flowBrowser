const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const { proxyUrl, eruda } = require('../js/proxyDependencies.js');  // Import proxyUrl and eruda flag from proxyDependencies.js

// Helper function to fetch and return assets (CSS, JS, images)
const fetchAsset = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      },
      responseType: 'arraybuffer', // To handle binary files like images, CSS, JS
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching asset: ${url}`, error);
    throw new Error(`Failed to fetch asset: ${url}`);
  }
};

// Proxy request handler for HTML content
const proxyRequest = async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the HTML content of the target URL
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
    });

    const contentType = response.headers['content-type'];

    if (contentType && contentType.includes('text/html')) {
      const htmlContent = response.data;
      const $ = cheerio.load(htmlContent);

      // Inject Eruda script if the 'eruda' flag is true
      if (eruda) {
        $('body').append(`
          <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
          <script>
            if (typeof eruda === 'function') {
              eruda.init();
            }
          </script>
        `);
      }

      // Replace relative URLs (href, src, etc.) with proxied URLs
      $('a, img, script, link').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || $el.attr('src');
        
        if (href) {
          const proxiedUrl = `${proxyUrl}${encodeURIComponent(href)}`;
          if ($el.is('a')) {
            $el.attr('href', proxiedUrl);
          } else {
            $el.attr('src', proxiedUrl);
          }
        }
      });

      // Send the modified HTML as plain text
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send($.html());
    } else {
      res.status(415).json({ error: 'The URL does not return an HTML document' });
    }
  } catch (error) {
    console.error('Error fetching HTML:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Asset proxy handler for CSS, JS, and images
const assetProxy = async (req, res) => {
  const assetUrl = decodeURIComponent(req.query.url);

  if (!assetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // Fetch the asset from the target URL
    const data = await fetchAsset(assetUrl);

    // Set appropriate content type based on file extension
    const extname = path.extname(assetUrl);
    let contentType = 'application/octet-stream';

    if (extname === '.css') contentType = 'text/css';
    if (extname === '.js') contentType = 'application/javascript';
    if (extname === '.jpg' || extname === '.jpeg') contentType = 'image/jpeg';
    if (extname === '.png') contentType = 'image/png';
    if (extname === '.gif') contentType = 'image/gif';

    res.setHeader('Content-Type', contentType);
    res.send(data);  // Send the asset data back to the client
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

// Main function to handle both HTML and asset requests
module.exports = async (req, res) => {
  if (req.query.url && (req.query.url.includes('.js') || req.query.url.includes('.css') || req.query.url.includes('.jpg') || req.query.url.includes('.png') || req.query.url.includes('.gif'))) {
    // If the request is for an asset (CSS, JS, image), handle it here
    await assetProxy(req, res);
  } else {
    // Otherwise, handle it as an HTML page proxy request
    await proxyRequest(req, res);
  }
};
