const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const API_KEY = "api key here";
const ENDPOINT = "https://api.cognitive.microsofttranslator.com";
const LOCATION = "global"; // e.g., "eastus"

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

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));