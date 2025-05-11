app.get('/api/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
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
        poster = $(el).attr('poster');
        if (poster && !poster.startsWith('http')) {
          $(el).attr('poster', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(poster)}`));
        }
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
      } else if (tagName === 'form') {
        action = $(el).attr('action');
        if (action && !action.startsWith('http')) {
          $(el).attr('action', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(action)}`));
        }
      } else if (tagName === 'link') {
        href = $(el).attr('href');
        if (href && !href.startsWith('http')) {
          if (!href.startsWith('/')) {
            $(el).attr('href', decodeURIComponentCustom(`${targetUrl}/${encodeURIComponent(href)}`));
          } else {
            $(el).attr('href', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(href)}`));
          }
        }
      } else if (tagName === 'script') {
        src = $(el).attr('src');
        if (src && !src.startsWith('http')) {
          $(el).attr('src', decodeURIComponentCustom(`${targetUrl}${encodeURIComponent(src)}`));
        }
      }
    });

    if (eruda) {
      $('body').append(`
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `);
    }

    res.send($.html());

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
