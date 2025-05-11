const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { eruda } = require('../js/proxyDependencies');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'js')));

app.get('/api/index.js', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'Accept': 'application/json, application/javascript, text/css',
      },
    });

    const contentType = response.headers['content-type'];
    const tmpFilePath = path.join(__dirname, 'js', 'proxy.js');

    let modifiedData = response.data;

    if (contentType.includes('application/json')) {
      modifiedData = JSON.stringify(response.data);
      fs.writeFileSync(tmpFilePath, modifiedData, 'utf8');
    } else if (contentType.includes('application/javascript')) {
      modifiedData = modifiedData.replace('console.log("Hello World!");', 'console.log("This is the proxied JS!");');
      fs.writeFileSync(tmpFilePath, modifiedData, 'utf8');
    } else if (contentType.includes('text/css')) {
      modifiedData = modifiedData.replace('body {', 'body { background-color: #f0f0f0;');
      fs.writeFileSync(tmpFilePath, modifiedData, 'utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported content type' });
    }

    if (eruda) {
      modifiedData += `
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      `;
    }

    return res.json({ message: 'Data saved and modified successfully, fetch it from /js/proxy.js' });

  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`);
});
