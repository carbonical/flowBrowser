const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { eruda } = require('../js/proxyDependencies');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.use('/js', express.static(path.join(__dirname, 'js')));

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
    .replace(/%60/g, '')
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

app.get('/api/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    if (targetUrl.includes('https://google.com')) {
      const filePath = path.join(process.cwd(), 'static', 'google', 'index.html');
      let data = fs.readFileSync(filePath, 'utf8');
      data = data.replace(
        /<\/body>/i,
        
          `<script>
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

    // Only handle JSON and JS content
    const contentType = response.headers['content-type'];
    if (contentType.includes('application/json') || contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
      const tmpFilePath = path.join(__dirname, 'js', 'proxy.js');
      fs.writeFileSync(tmpFilePath, response.data, 'utf8');
      return res.json({ message: 'Data saved and modified successfully, fetch it from /js/proxy.js' });
    }

    // Process HTML content (e.g., for links, scripts, etc.)
    const $ = cheerio.load(response.data);

    $('a, img, video, form, iframe, link[rel="stylesheet"], script[src], link[rel="icon"], link[rel="apple-touch-icon"], [srcset]').each((i, el) => {
      const tagName = el.tagName.toLowerCase();
      let src, href, action, poster, srcset;

      if (tagName === 'a') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(href)}`));
        }
      } else if (tagName === 'img') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
        srcset = $(el).attr('srcset');
        if (srcset) {
          const updatedSrcset = srcset.split(',').map(src => {
            const [url] = src.split(' ');
            return `${decodeURIComponentCustom(targetUrl + encodeURIComponent(url))}${src.slice(url.length)}`;
          }).join(',');
          $(el).attr('srcset', updatedSrcset);
        }
      } else if (tagName === 'iframe') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
      } else if (tagName === 'video') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
        poster = $(el).attr('poster');
        if (poster && !poster.startsWith('http')) {
          $(el).attr('poster', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(poster)}`));
        }
      } else if (tagName === 'form') {
        action = $(el).attr('action');
        if (action && !action.startsWith('http')) {
          $(el).attr('action', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(action)}`));
        }
      } else if (tagName === 'link') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          $(el).attr('href', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(href)}`));
        }
      } else if (tagName === 'script') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
      }
    });

    if (eruda) {
      $('body').append(
        `<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>`
      );
    }

    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`CORS proxy server is running at http://localhost:${port}`);
});
