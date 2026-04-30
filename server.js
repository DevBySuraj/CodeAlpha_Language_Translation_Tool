const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- CONFIGURATION ---
require('dotenv').config(); // Add this at the top (npm install dotenv)
const API_KEY = process.env.AZURE_KEY;
const LOCATION = process.env.AZURE_REGION;
const ENDPOINT = process.env.ENDPOINT;
const VISION_KEY = process.env.VISION_KEY;
const VISION_ENDPOINT = process.env.VISION_ENDPOINT;

app.post('/translate', async (req, res) => {
    const { text, from, to } = req.body;

    try {
        const response = await axios({
            baseURL: ENDPOINT,
            url: '/translate',
            method: 'post',
            params: {
                'api-version': '3.0',
                'from': from || undefined, // undefined lets Azure auto-detect
                'to': to
            },
            headers: {
                'Ocp-Apim-Subscription-Key': API_KEY,
                'Ocp-Apim-Subscription-Region': LOCATION,
                'Content-Type': 'application/json'
            },
            data: [{ 'text': text }],
            responseType: 'json'
        });

        const data = response.data[0];
        res.json({
            translation: data.translations[0].text,
            detectedLanguage: data.detectedLanguage ? data.detectedLanguage.language : null
        });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Azure API call failed" });
    }
});

app.post('/ocr', async (req, res) => {
    const { image } = req.body;
    if (!image || !VISION_KEY || !VISION_ENDPOINT) {
        return res.status(400).json({ error: "Missing image or Vision credentials" });
    }

    try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        // Note: ensure VISION_ENDPOINT doesn't end with a trailing slash if using string interpolation
        const endpointUrl = VISION_ENDPOINT.endsWith('/') ? VISION_ENDPOINT.slice(0, -1) : VISION_ENDPOINT;

        const response = await axios({
            method: 'post',
            url: `${endpointUrl}/vision/v3.2/ocr?language=unk&detectOrientation=true`,
            headers: {
                'Ocp-Apim-Subscription-Key': VISION_KEY,
                'Content-Type': 'application/octet-stream'
            },
            data: buffer
        });

        const regions = response.data.regions;
        let extractedText = '';
        if (regions) {
            regions.forEach(region => {
                region.lines.forEach(line => {
                    line.words.forEach(word => {
                        extractedText += word.text + ' ';
                    });
                    extractedText += '\n';
                });
            });
        }

        res.json({ text: extractedText.trim() });

    } catch (error) {
        console.error("OCR Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Azure Vision API call failed" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));