import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;


await mongoose.connect(mongoURI);

const urlSchema = new mongoose.Schema({
  originalUrl: {type: String, required: true},
  shortUrl: {type: String, required: true, unique: true}
})

const Url = mongoose.model('Url', urlSchema);

// ZOD para validação
app.post('/api/shortenurl', async (req, res) =>{
  const { originalUrl } = req.body;
  const shortUrl = nanoid(8)
  const newUrl = new Url({ originalUrl, shortUrl });
  
  try {
    await newUrl.save();
    res.status(201).json({ originalUrl, shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error saving URL' });
  }
})

app.get('/api/:shortUrl', async (req, res) => {
  	const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (url) {
      return res.redirect(url.originalUrl);
    } else {
      return res.status(404).json({ error: 'URL not found'})
    }
})

app.listen(3000, () => console.log('Server running on port 3000'));