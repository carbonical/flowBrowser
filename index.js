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
    // Validate the target URL
    const parsedUrl = new URL(targetUrl);
    
    // Remove the 'url' query parameter
    parsedUrl.searchParams.delete('url');
    
    // Now we are using the cleaned target URL without any 'url' query parameter.
    // You can also add further checks for the protocol (HTTP/HTTPS) if necessary.
    
    // Set up the proxy middleware with the cleaned URL
    createProxyMiddleware({
      target: parsedUrl.toString(),
      changeOrigin: true,
      pathRewrite: {
        '^/proxy': '', // Remove /proxy from the forwarded URL
      },
    })(req, res, next);
    
  } catch (e) {
    return res.status(400).send('Invalid "url" query parameter.');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
