const jwt = require('jsonwebtoken');
const db = require('../database/db');

class AuthService {
  static generateToken(userId, username) {
    const payload = {
      userId,
      username,
      iat: Date.now()
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  static async saveSession(userId, token) {
    return new Promise((resolve, reject) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

      db.run(
        `INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)`,
        [userId, token, expiresAt.toISOString()],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  static async invalidateSession(token) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE user_sessions SET isActive = 0 WHERE token = ?`,
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

  static async isTokenActive(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM user_sessions WHERE token = ? AND isActive = 1 AND expiresAt > datetime('now')`,
        [token],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  static async cleanExpiredSessions() {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM user_sessions WHERE expiresAt < datetime('now') OR isActive = 0`,
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

module.exports = AuthService;
