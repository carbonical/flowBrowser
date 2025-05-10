const axios = require('axios');
const cheerio = require('cheerio');
const { proxyUrl, eruda } = require('../js/proxyDependencies.js');  // Import proxyUrl and eruda from proxyDependencies.js

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

      if (eruda) {
        // Inject Eruda script if 'eruda' is true
        $('body').append(`
          <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
          <script>eruda.init();</script>
        `);
      }

      // Replace all relative URLs with the proxied URLs
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

module.exports = async (req, res) => {
  await proxyRequest(req, res);
};
