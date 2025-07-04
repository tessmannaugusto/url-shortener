import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { z } from 'zod';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const originalUrlSchema = z.object({
    originalUrl: z.string().url('Invalid URL')
});
const shortUrlSchema = z.object({
    shortUrl: z.string().length(8, 'id must be 8 characters')
});
const mongoURI = process.env.MONGO_URI || 'server';
const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true }
});
const Url = mongoose.model('Url', urlSchema);
const router = express.Router();
router.post('/shortenurl', async (req, res) => {
    const result = originalUrlSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: 'Validation failed',
            issues: result.error.format()
        });
    }
    const { originalUrl } = result.data;
    const shortUrl = nanoid(8);
    const newUrl = new Url({ originalUrl, shortUrl });
    try {
        await newUrl.save();
        res.status(201).json({ originalUrl, shortUrl });
    }
    catch (error) {
        res.status(500).json({ error: 'Error saving URL' });
    }
});
router.get('/:shortUrl', async (req, res) => {
    const result = shortUrlSchema.safeParse(req.params);
    if (!result.success) {
        return res.status(400).json({
            error: 'Validation failed',
            issues: result.error.format()
        });
    }
    const { shortUrl } = result.data;
    try {
        const url = await Url.findOne({ shortUrl });
        if (url) {
            return res.redirect(url.originalUrl);
        }
        else {
            return res.status(404).json({ error: 'URL not found' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});
const startServer = async () => {
    try {
        await mongoose.connect(mongoURI);
        app.use('/api', router);
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};
startServer();
