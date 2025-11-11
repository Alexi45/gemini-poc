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

const GEMINI_API_URL = 'https://api.openai.com/v1/chat/completions'; // placeholder, ajuste según Gemini real

app.post('/api/generate', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    // Construye la petición al LLM (el formato puede necesitar ajuste para Gemini)
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un asistente útil.' },
        { role: 'user', content: message }
      ],
      stream: true
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('LLM error:', text);
      return res.status(500).json({ error: 'LLM API error', details: text });
    }

    // Re-enviamos la respuesta de streaming al cliente usando chunked transfer
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      // Reenvía los chunks tal cual
      res.write(text);
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
