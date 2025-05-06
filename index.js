const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter.');
  }

  try {
    const parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid "url" query parameter.');
  }

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy': '',
    },
  })(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
