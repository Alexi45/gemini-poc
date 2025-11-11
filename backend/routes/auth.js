const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP cada 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP cada hora
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP. Intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rutas públicas (sin autenticación)
router.post('/register', registerLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;
