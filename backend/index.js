// backend/index.js
// Servidor Express con autenticación y chat con Gemini AI
// Mantiene la clave de API en el servidor (archivo .env)

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importar middleware y rutas
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const AuthService = require('./services/AuthService');

// Inicializar base de datos
require('./database/db');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Limpiar sesiones expiradas cada hora
setInterval(async () => {
  try {
    await AuthService.cleanExpiredSessions();
    console.log('🧹 Sesiones expiradas limpiadas');
  } catch (error) {
    console.error('Error limpiando sesiones:', error);
  }
}, 60 * 60 * 1000);

// Rutas de autenticación
app.use('/api/auth', authRoutes);

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

app.post('/api/generate', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensaje requerido' 
      });
    }

    console.log(`🔮 Usuario ${user.username} enviando a Gemini:`, message);

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
      return res.status(500).json({ 
        success: false, 
        error: 'Error de API de Gemini', 
        details: text 
      });
    }

    const data = await response.json();
    console.log('✅ Respuesta de Gemini recibida');
    
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!assistantMessage) {
      console.error('No message in response:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'Sin respuesta de Gemini', 
        details: data 
      });
    }
    
    // TODO: Guardar historial de chat en la base de datos
    // await saveChatHistory(user.id, message, assistantMessage);
    
    res.json({ 
      success: true, 
      message: assistantMessage,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error en /api/generate:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${port}`);
  console.log(`🔒 Autenticación: Habilitada`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configurada' : 'No configurada'}`);
});
