const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;  // Use environment port or default to 3000

// Proxy setup
app.use('/proxy', createProxyMiddleware({
  target: 'http://example.com',  // Replace this with the target URL you want to proxy to
  changeOrigin: true,            // Adjusts the origin header to match the target
  pathRewrite: {
    '^/proxy': '',              // Remove '/proxy' from the incoming URL path
  },
}));

// Start the server
app.listen(PORT, () => {
  console.log(`CamoAPI-V2 Proxy Server running at http://localhost:${PORT}`);
});
