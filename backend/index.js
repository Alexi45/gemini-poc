const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Inicializar base de datos
const { getDatabaseManager } = require('./database/db');
const { getAuthServiceInstance } = require('./services/AuthService');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos
try {
  getDatabaseManager();
  console.log('✅ Sistema de base de datos inicializado');
} catch (error) {
  console.error('❌ Error inicializando base de datos:', error);
  process.exit(1);
}

// Limpieza periódica de datos expirados
setInterval(() => {
  try {
    const authService = getAuthServiceInstance();
    authService.cleanup();
  } catch (error) {
    console.error('Error en limpieza periódica:', error);
  }
}, 60 * 60 * 1000); // Cada hora

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  try {
    const dbManager = getDatabaseManager();
    const stats = dbManager.getStats();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: stats,
      gemini: {
        configured: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Ruta de prueba para verificar la conexión con Gemini
app.get('/api/test-gemini', async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API key de Gemini no configurada'
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent("Solo responde 'OK' si puedes leer este mensaje");
    const response = result.response;
    
    res.json({
      success: true,
      message: 'Gemini AI está funcionando correctamente',
      response: response.text()
    });
  } catch (error) {
    console.error('Error probando Gemini:', error);
    res.status(500).json({
      success: false,
      error: 'Error al conectar con Gemini AI',
      details: error.message
    });
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Manejador para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador de cierre graceful
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  const dbManager = getDatabaseManager();
  dbManager.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  const dbManager = getDatabaseManager();
  dbManager.close();
  process.exit(0);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${port}`);
  console.log(`🔒 Autenticación: Habilitada`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configurada' : 'No configurada'}`);
  console.log(`📊 Base de datos: SQLite con better-sqlite3`);
});
