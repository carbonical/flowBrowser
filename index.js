const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve Eruda for debugging on mobile
app.use('/eruda', (req, res) => {
  res.send(`
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      </head>
      <body>
        <h1>Eruda Mobile Debugging</h1>
        <p>You can now open the Eruda console on your mobile browser for debugging.</p>
      </body>
    </html>
  `);
});

// Proxy route
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter.');
  }

  try {
    // Parse the target URL from the query parameter
    const parsedUrl = new URL(targetUrl);

    // Clean up the URL by removing any unwanted query parameters
    // Make sure we don't forward any query parameters like `url`
    parsedUrl.searchParams.delete('url'); // This ensures no 'url' query is forwarded

    // Now set up the proxy middleware
    createProxyMiddleware({
      target: parsedUrl.toString(), // Use the cleaned URL
      changeOrigin: true,
      pathRewrite: {
        '^/proxy': '', // Remove /proxy from the forwarded URL
      },
      onProxyReq: (proxyReq, req, res) => {
        // Optionally, log the proxied request for debugging
        console.log('Proxying request to:', parsedUrl.toString());
      }
    })(req, res, next);

  } catch (e) {
    return res.status(400).send('Invalid "url" query parameter.');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
