// backend/index.js
// Servidor Express simple que expone una ruta POST /api/generate
// Mantiene la clave de API en el servidor (archivo .env)

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Ruta de prueba para verificar la API
app.get('/api/test', async (req, res) => {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Configured' : 'Missing');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (response.ok) {
      res.json({ success: true, models: data.models?.map(m => m.name) || [] });
    } else {
      res.json({ success: false, error: data });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    console.log('Sending to Gemini:', message);

    // Formato correcto para Gemini API
    const body = {
      contents: [{
        parts: [{ text: message }]
      }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error:', text);
      return res.status(500).json({ error: 'Gemini API error', details: text });
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));
    
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!assistantMessage) {
      console.error('No message in response:', data);
      return res.status(500).json({ error: 'No response from Gemini', details: data });
    }
    
    res.json({ message: assistantMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
