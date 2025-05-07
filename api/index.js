import axios from 'axios';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); // Enable CORS

app.get('/api/index.js', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('Missing `url` query parameter.');
    }

    const response = await axios.get(decodeURIComponent(url));
    res.setHeader('Content-Type', response.headers['content-type']);
    return res.send(response.data);
  } catch (error) {
    return res.status(500).send('Error: ' + error.message);
  }
});

export default app;
