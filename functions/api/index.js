// Required modules
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Serve static files from 'js' directory
app.use('/js', express.static(path.join(__dirname, 'js')));

// Custom decodeURIComponent function
function decodeURIComponentCustom(data) {
  return decodeURIComponent(data);
}

// API endpoint to proxy and modify HTML content
app.get('/api/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    if (targetUrl.includes('google.com/search')) {
      const formRegex = /<form\s+class="tsf"[^>]*role="search"[^>]*>[\s\S]*?<\/form>/i;

      let data = await axios.get(targetUrl);
      data = data.data.replace(formRegex, '');

      return res.send(`
        <body>
          <script>
            alert('Google will attempt to load from 3–30 or more times before it succeeds.');
            window.location.href = '/API/google/index.js?url=' + encodeURIComponent(${JSON.stringify(targetUrl)});
          </script>
        </body>
      `);
    } else if (targetUrl.includes('https://google.com')) {
      const filePath = path.join(process.cwd(), 'static', 'google', 'index.html');
      let data = fs.readFileSync(filePath, 'utf8');

      data = data.replace(
        /<\/body>/i,
        `
          <script>
            document.addEventListener('DOMContentLoaded', function () {
              const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
              if (searchInput) {
                searchInput.addEventListener('keypress', function (event) {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    const searchTerm = searchInput.value;
                    const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchTerm);
                    window.location.href = '/API/index.js?url=' + encodeURIComponent(searchUrl);
                  }
                });
              }
            });
          </script>
        </body>`
      );

      return res.send(data);
    }

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      responseType: 'arraybuffer',
      maxRedirects: 5,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', response.headers['content-type']);

    const $ = cheerio.load(response.data);

    $('img, a, iframe, video, source, link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"], [srcset]').each((i, el) => {
      const tagName = el.tagName.toLowerCase();
      let src, href, action, poster, srcset;

      if (tagName === 'img') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(src))}`);
        }
        srcset = $(el).attr('srcset');
        if (srcset) {
          const updatedSrcset = srcset.split(',').map(src => {
            const [url] = src.trim().split(' ');
            return `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(url))}${src.slice(url.length)}`;
          }).join(',');
          $(el).attr('srcset', updatedSrcset);
        }
      }
      else if (tagName === 'a') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(href))}`);
        }
      }
      else if (tagName === 'iframe') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(src))}`);
        }
      }
      else if (tagName === 'video') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(src))}`);
        }
        poster = $(el).attr('poster');
        if (poster && !poster.startsWith('http')) {
          $(el).attr('poster', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(poster))}`);
        }
      }
      else if (tagName === 'source') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(src))}`);
        }
      }
      else if (tagName === 'link') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', `${targetUrl}${decodeURIComponentCustom(encodeURIComponent(href))}`);
        }
      }
    });

    $('body').append(
      `<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>`
    );
    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
