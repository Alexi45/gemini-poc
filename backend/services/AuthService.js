const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDatabaseManager } = require('../database/db');

class AuthService {
  constructor() {
    this.db = getDatabaseManager().getDatabase();
  }

  // Generar JWT token
  generateToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });
    } catch (error) {
      console.error('Error generando token:', error);
      throw new Error('Error al generar token de autenticación');
    }
  }

  // Verificar JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  // Guardar sesión en la base de datos
  async saveSession(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

      const result = await this.db.runAsync(`
        INSERT INTO user_sessions (user_id, session_token, expires_at)
        VALUES (?, ?, ?)
      `, [userId, token, expiresAt.toISOString()]);

      return result.lastID;
    } catch (error) {
      console.error('Error guardando sesión:', error);
      throw new Error('Error al guardar la sesión');
    }
  }

  // Verificar si la sesión es válida
  async isValidSession(token) {
    try {
      const session = await this.db.getAsync(`
        SELECT * FROM user_sessions 
        WHERE session_token = ? AND expires_at > datetime('now')
      `, [token]);
      return !!session;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return false;
    }
  }

  // Invalidar sesión
  async invalidateSession(token) {
    try {
      const result = await this.db.runAsync('DELETE FROM user_sessions WHERE session_token = ?', [token]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error invalidando sesión:', error);
      throw new Error('Error al invalidar la sesión');
    }
  }

  // Invalidar todas las sesiones de un usuario
  async invalidateAllUserSessions(userId) {
    try {
      const result = await this.db.runAsync('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
      return result.changes;
    } catch (error) {
      console.error('Error invalidando sesiones del usuario:', error);
      throw new Error('Error al invalidar las sesiones');
    }
  }

  // Generar token de recuperación de contraseña
  async generatePasswordResetToken(userId) {
    try {
      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de expiración

      // Invalidar tokens existentes para este usuario
      await this.db.runAsync('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

      // Crear nuevo token
      const result = await this.db.runAsync(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `, [userId, token, expiresAt.toISOString()]);
      
      if (result.lastID) {
        return token;
      }
      
      throw new Error('No se pudo generar el token');
    } catch (error) {
      console.error('Error generando token de recuperación:', error);
      throw new Error('Error al generar el token de recuperación');
    }
  }

  // Verificar token de recuperación de contraseña
  async verifyPasswordResetToken(token) {
    try {
      const tokenData = await this.db.getAsync(`
        SELECT * FROM password_reset_tokens
        WHERE token = ? AND expires_at > datetime('now') AND used = 0
      `, [token]);

      if (!tokenData) {
        return { valid: false, reason: 'Token no encontrado o expirado' };
      }

      return { valid: true, userId: tokenData.user_id };
    } catch (error) {
      console.error('Error verificando token de recuperación:', error);
      return { valid: false, reason: 'Error interno' };
    }
  }

  // Marcar token de recuperación como usado
  async markPasswordResetTokenAsUsed(token) {
    try {
      const result = await this.db.runAsync(`
        UPDATE password_reset_tokens 
        SET used = 1 
        WHERE token = ?
      `, [token]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error marcando token como usado:', error);
      throw new Error('Error al procesar el token');
    }
  }

  // Obtener información de la sesión por token
  async getSessionInfo(token) {
    try {
      return await this.db.getAsync(`
        SELECT s.user_id, s.expires_at, u.email
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.expires_at > datetime('now')
      `, [token]);
    } catch (error) {
      console.error('Error obteniendo información de sesión:', error);
      return null;
    }
  }

  // Limpiar sesiones y tokens expirados
  async cleanup() {
    try {
      const dbManager = getDatabaseManager();
      await dbManager.cleanup();
    } catch (error) {
      console.error('Error en limpieza de AuthService:', error);
    }
  }

  // Métodos para manejo de tokens de reseteo de contraseña
  static async savePasswordResetToken(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
      // Primero invalidamos cualquier token existente para este usuario
      db.run(
        `UPDATE password_reset_tokens SET isUsed = 1 WHERE userId = ? AND isUsed = 0`,
        [userId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Luego insertamos el nuevo token
          db.run(
            `INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)`,
            [userId, token, expiresAt.toISOString()],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
        }
      );
    });
  }

  static async verifyPasswordResetToken(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT userId, token FROM password_reset_tokens 
         WHERE token = ? AND isUsed = 0 AND expiresAt > datetime('now')`,
        [token],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  static async invalidatePasswordResetToken(token) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE password_reset_tokens SET isUsed = 1 WHERE token = ?`,
        [token],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  static async cleanExpiredResetTokens() {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM password_reset_tokens WHERE expiresAt < datetime('now') OR isUsed = 1`,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }
}

// Instancia singleton
let authServiceInstance = null;

function getAuthServiceInstance() {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

module.exports = {
  AuthService,
  getAuthServiceInstance
};