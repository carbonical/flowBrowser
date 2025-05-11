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

// URL Decoding Function (matches your code)
function decodeURIComponentCustom(data) {
  return data.replace(/%20/g, ' ')
    .replace(/%21/g, '!')
    .replace(/%22/g, '"')
    .replace(/%23/g, '#')
    .replace(/%24/g, '$')
    .replace(/%25/g, '%')
    .replace(/%26/g, '&')
    .replace(/%27/g, "'")
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/g, '*')
    .replace(/%2B/g, '+')
    .replace(/%2C/g, ',')
    .replace(/%2D/g, '-')
    .replace(/%2E/g, '.')
    .replace(/%2F/g, '/')
    .replace(/%30/g, '0')
    .replace(/%31/g, '1')
    .replace(/%32/g, '2')
    .replace(/%33/g, '3')
    .replace(/%34/g, '4')
    .replace(/%35/g, '5')
    .replace(/%36/g, '6')
    .replace(/%37/g, '7')
    .replace(/%38/g, '8')
    .replace(/%39/g, '9')
    .replace(/%3A/g, ':')
    .replace(/%3B/g, ';')
    .replace(/%3C/g, '<')
    .replace(/%3D/g, '=')
    .replace(/%3E/g, '>')
    .replace(/%3F/g, '?')
    .replace(/%40/g, '@')
    .replace(/%41/g, 'A')
    .replace(/%42/g, 'B')
    .replace(/%43/g, 'C')
    .replace(/%44/g, 'D')
    .replace(/%45/g, 'E')
    .replace(/%46/g, 'F')
    .replace(/%47/g, 'G')
    .replace(/%48/g, 'H')
    .replace(/%49/g, 'I')
    .replace(/%4A/g, 'J')
    .replace(/%4B/g, 'K')
    .replace(/%4C/g, 'L')
    .replace(/%4D/g, 'M')
    .replace(/%4E/g, 'N')
    .replace(/%4F/g, 'O')
    .replace(/%50/g, 'P')
    .replace(/%51/g, 'Q')
    .replace(/%52/g, 'R')
    .replace(/%53/g, 'S')
    .replace(/%54/g, 'T')
    .replace(/%55/g, 'U')
    .replace(/%56/g, 'V')
    .replace(/%57/g, 'W')
    .replace(/%58/g, 'X')
    .replace(/%59/g, 'Y')
    .replace(/%5A/g, 'Z')
    .replace(/%5B/g, '[')
    .replace(/%5C/g, '\\')
    .replace(/%5D/g, ']')
    .replace(/%5E/g, '^')
    .replace(/%5F/g, '_')
    .replace(/%60/g, '`')
    .replace(/%61/g, 'a')
    .replace(/%62/g, 'b')
    .replace(/%63/g, 'c')
    .replace(/%64/g, 'd')
    .replace(/%65/g, 'e')
    .replace(/%66/g, 'f')
    .replace(/%67/g, 'g')
    .replace(/%68/g, 'h')
    .replace(/%69/g, 'i')
    .replace(/%6A/g, 'j')
    .replace(/%6B/g, 'k')
    .replace(/%6C/g, 'l')
    .replace(/%6D/g, 'm')
    .replace(/%6E/g, 'n')
    .replace(/%6F/g, 'o')
    .replace(/%70/g, 'p')
    .replace(/%71/g, 'q')
    .replace(/%72/g, 'r')
    .replace(/%73/g, 's')
    .replace(/%74/g, 't')
    .replace(/%75/g, 'u')
    .replace(/%76/g, 'v')
    .replace(/%77/g, 'w')
    .replace(/%78/g, 'x')
    .replace(/%79/g, 'y')
    .replace(/%7A/g, 'z')
    .replace(/%7B/g, '{')
    .replace(/%7C/g, '|')
    .replace(/%7D/g, '}')
    .replace(/%7E/g, '~');
}

// Proxy HTML content and apply URL decoding
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

    // Define the base proxy URL
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

    // Get the modified HTML as a string
    let html = $.html();

    // Decode the HTML content to handle URL-encoded characters
    html = decodeURIComponentCustom(html);

    // Send the updated HTML back as the response
    res.send(html);

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
