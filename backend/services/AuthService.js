const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthService {
  constructor() {
    // Temporalmente sin DB para debuggear
    this.db = null;
  }

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

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  async saveSession(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO user_sessions (user_id, session_token, expires_at)
          VALUES (?, ?, ?)
        `, [userId, token, expiresAt.toISOString()], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      });
    } catch (error) {
      console.error('Error guardando sesión:', error);
      throw new Error('Error al guardar la sesión');
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

  async invalidateSession(token) {
    try {
      const result = await this.db.runAsync('DELETE FROM user_sessions WHERE session_token = ?', [token]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error invalidando sesión:', error);
      return false;
    }
  }

  async invalidateUserSessions(userId) {
    try {
      const result = await this.db.runAsync('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
      return result.changes;
    } catch (error) {
      console.error('Error invalidando sesiones de usuario:', error);
      return 0;
    }
  }

  async generatePasswordResetToken(userId) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.db.runAsync('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO password_reset_tokens (user_id, token, expires_at)
          VALUES (?, ?, ?)
        `, [userId, token, expiresAt.toISOString()], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        });
      });
    } catch (error) {
      console.error('Error generando token de recuperación:', error);
      throw new Error('Error al generar el token de recuperación');
    }
  }

  async verifyPasswordResetToken(token) {
    try {
      const tokenData = await this.db.getAsync(`
        SELECT user_id, expires_at 
        FROM password_reset_tokens 
        WHERE token = ? AND expires_at > datetime('now') AND used = 0
      `, [token]);

      return tokenData || null;
    } catch (error) {
      console.error('Error verificando token de recuperación:', error);
      return null;
    }
  }

  async markResetTokenAsUsed(token) {
    try {
      const result = await this.db.runAsync(`
        UPDATE password_reset_tokens 
        SET used = 1 
        WHERE token = ?
      `, [token]);

      return result.changes > 0;
    } catch (error) {
      console.error('Error marcando token como usado:', error);
      throw new Error('Error al marcar token como usado');
    }
  }

  async getSessionInfo(token) {
    try {
      return await this.db.getAsync(`
        SELECT s.user_id, s.expires_at, u.email
        FROM user_sessions s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.expires_at > datetime('now')
      `, [token]);
    } catch (error) {
      console.error('Error obteniendo información de sesión:', error);
      return null;
    }
  }

  async cleanup() {
    try {
      const db = this.db;
      
      const sessionsPromise = new Promise((resolve, reject) => {
        db.run('DELETE FROM user_sessions WHERE expires_at < datetime("now")', function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      });

      const tokensPromise = new Promise((resolve, reject) => {
        db.run('DELETE FROM password_reset_tokens WHERE expires_at < datetime("now") OR used = 1', function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      });

      const [sessionsDeleted, tokensDeleted] = await Promise.all([sessionsPromise, tokensPromise]);
      
      if (sessionsDeleted > 0 || tokensDeleted > 0) {
        console.log(`🧹 Limpieza completada: ${sessionsDeleted} sesiones, ${tokensDeleted} tokens`);
      }
      
      return { sessionsDeleted, tokensDeleted };
    } catch (error) {
      console.error('Error en limpieza:', error);
      throw error;
    }
  }
}

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