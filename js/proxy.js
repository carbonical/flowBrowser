const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/js/proxy.js', (req, res) => {
  const tmpFilePath = path.join(__dirname, 'js', 'proxy.js');

  if (!fs.existsSync(tmpFilePath)) {
    return res.status(404).json({ error: 'No cached resource found' });
  }

  const fileContent = fs.readFileSync(tmpFilePath, 'utf8');
  const contentType = tmpFilePath.endsWith('.js') ? 'application/javascript' :
                      tmpFilePath.endsWith('.json') ? 'application/json' :
                      tmpFilePath.endsWith('.css') ? 'text/css' :
                      tmpFilePath.endsWith('.html') ? 'text/html' : 'text/plain';

  res.setHeader('Content-Type', contentType);
  return res.send(fileContent);
});

app.listen(port, () => {
  console.log(`Proxy server is running at http://localhost:${port}`);
});
