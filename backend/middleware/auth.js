const { getUserInstance } = require('../models/User');
const jwt = require('jsonwebtoken');

// AuthService inline para evitar problemas de importación
class AuthService {
  constructor() {
    const { getDatabaseManager } = require('../database/db');
    this.db = getDatabaseManager().getDatabase();
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  async isValidSession(token) {
    try {
      const session = await this.db.getAsync(`
        SELECT user_id, expires_at 
        FROM user_sessions 
        WHERE session_token = ? AND expires_at > datetime('now')
      `, [token]);

      return session ? session.user_id : null;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return null;
    }
  }
}

function getAuthServiceInstance() {
  return new AuthService();
}

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acceso denegado. No se proporcionó token de autenticación.' 
      });
    }

    const authService = getAuthServiceInstance();

    // Verificar si la sesión es válida en la base de datos
    const isValidSession = await authService.isValidSession(token);
    if (!isValidSession) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión inválida o expirada. Por favor, inicia sesión nuevamente.' 
      });
    }

    // Verificar y decodificar el token JWT
    const decoded = authService.verifyToken(token);
    
    // Obtener información del usuario
    const userModel = getUserInstance();
    const user = await userModel.findById(decoded.userId);
    
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
      message: 'Error interno del servidor en autenticación'
    });
  }
};

module.exports = authMiddleware;
