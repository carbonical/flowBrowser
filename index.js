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

    // Clean up the URL by removing any query parameters we don't want to forward
    parsedUrl.searchParams.delete('url'); // Remove the 'url' parameter to avoid redirect loops

    // Create the proxy middleware with the cleaned-up target URL
    createProxyMiddleware({
      target: parsedUrl.toString(), // Use the cleaned URL
      changeOrigin: true,
      pathRewrite: {
        '^/proxy': '', // Remove /proxy from the forwarded URL
      },
      onProxyReq: (proxyReq, req, res) => {
        // Optionally log the proxied request for debugging purposes
        console.log('Proxying request to:', parsedUrl.toString());
      },
      // Handle the response to ensure that redirects are not followed
      onProxyRes: (proxyRes, req, res) => {
        // Check if the response is a redirect (HTTP status 3xx)
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
          // Log the redirection response
          console.log('Redirect detected:', proxyRes.headers.location);
          
          // Instead of following the redirect, you can choose to handle it or just forward the original response
          res.status(proxyRes.statusCode).send('Redirects are not supported by this proxy.');
        }
      }
    })(req, res, next);

  } catch (e) {
    return res.status(400).send('Invalid "url" query parameter.');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
