const bcrypt = require('bcrypt');
const { getDatabaseManager } = require('../database/db');

class User {
  constructor() {
    this.db = getDatabaseManager().getDatabase();
    this.saltRounds = 12;
  }

  // Crear nuevo usuario
  async create(email, password) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.db.getAsync('SELECT id FROM users WHERE email = ? AND is_active = 1', [email]);
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // Insertar el usuario
      const result = await this.db.runAsync(`
        INSERT INTO users (email, password, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `, [email, hashedPassword]);
      
      if (result.lastID) {
        const newUser = await this.db.getAsync('SELECT * FROM users WHERE id = ? AND is_active = 1', [result.lastID]);
        // Remover la contraseña del objeto retornado
        delete newUser.password;
        return newUser;
      }
      
      throw new Error('Error creando usuario');
    } catch (error) {
      console.error('Error en User.create:', error);
      throw error;
    }
  }

  // Autenticar usuario
  async authenticate(email, password) {
    try {
      const user = await this.db.getAsync('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Actualizar último login
      await this.db.runAsync(`
        UPDATE users 
        SET last_login = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [user.id]);

      // Retornar usuario sin contraseña
      delete user.password;
      user.last_login = new Date().toISOString();
      return user;
    } catch (error) {
      console.error('Error en User.authenticate:', error);
      throw error;
    }
  }

  // Encontrar usuario por ID
  async findById(id) {
    try {
      const user = await this.db.getAsync('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
      if (user) {
        delete user.password;
      }
      return user;
    } catch (error) {
      console.error('Error en User.findById:', error);
      throw error;
    }
  }

  // Encontrar usuario por email
  async findByEmail(email) {
    try {
      const user = await this.db.getAsync('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
      if (user) {
        delete user.password;
      }
      return user;
    } catch (error) {
      console.error('Error en User.findByEmail:', error);
      throw error;
    }
  }

  // Actualizar contraseña
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      const result = await this.db.runAsync(`
        UPDATE users 
        SET password = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [hashedPassword, userId]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error en User.updatePassword:', error);
      throw error;
    }
  }

  // Desactivar usuario (soft delete)
  async deactivate(userId) {
    try {
      const result = await this.db.runAsync(`
        UPDATE users 
        SET is_active = 0, updated_at = datetime('now')
        WHERE id = ?
      `, [userId]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error en User.deactivate:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (para administración)
  async getAll() {
    try {
      const users = await this.db.allAsync(`
        SELECT id, email, created_at, updated_at, last_login, is_active
        FROM users 
        WHERE is_active = 1
        ORDER BY created_at DESC
      `);
      return users;
    } catch (error) {
      console.error('Error en User.getAll:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuario
  async getUserStats(userId) {
    try {
      const stats = await this.db.getAsync(`
        SELECT 
          u.id,
          u.email,
          u.created_at,
          u.last_login,
          COUNT(DISTINCT ch.conversation_id) as total_conversations,
          COUNT(ch.id) as total_messages,
          MAX(ch.timestamp) as last_message_at
        FROM users u
        LEFT JOIN chat_history ch ON u.id = ch.user_id
        WHERE u.id = ? AND u.is_active = 1
        GROUP BY u.id
      `, [userId]);
      return stats || null;
    } catch (error) {
      console.error('Error en User.getUserStats:', error);
      throw error;
    }
  }

  // Validar formato de email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar contraseña
  validatePassword(password) {
    // Mínimo 8 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Verificar si un usuario existe
  async exists(email) {
    try {
      const user = await this.db.getAsync('SELECT id FROM users WHERE email = ? AND is_active = 1', [email]);
      return !!user;
    } catch (error) {
      console.error('Error en User.exists:', error);
      throw error;
    }
  }

  static async updatePassword(userId, hashedPassword) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId],
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
let userInstance = null;

function getUserInstance() {
  if (!userInstance) {
    userInstance = new User();
  }
  return userInstance;
}

module.exports = {
  User,
  getUserInstance
};