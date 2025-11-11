const AuthService = require('../services/AuthService');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acceso denegado. No se proporcionó token de autenticación.' 
      });
    }

    // Verificar si el token está en la lista negra o expirado
    const isActive = await AuthService.isTokenActive(token);
    if (!isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' 
      });
    }

    // Verificar y decodificar el token
    const decoded = AuthService.verifyToken(token);
    
    // Obtener información del usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado. Token inválido.' 
      });
    }

    // Agregar información del usuario a la request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.message === 'Token inválido o expirado') {
      return res.status(401).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor durante la autenticación.' 
    });
  }
};

module.exports = authMiddleware;
