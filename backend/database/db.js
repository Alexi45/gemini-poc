const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const util = require('util');

class DatabaseManager {
  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }
    
    this.db = null;
    this.init();
    DatabaseManager.instance = this;
  }
  init() {
    try {
      const dbPath = path.join(__dirname, 'gemini_chat.db');
      this.db = new sqlite3.Database(dbPath);
      
      // Promisificar métodos de sqlite3
      this.db.runAsync = util.promisify(this.db.run).bind(this.db);
      this.db.getAsync = util.promisify(this.db.get).bind(this.db);
      this.db.allAsync = util.promisify(this.db.all).bind(this.db);
      
      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');
      
      this.createTables();
      // Los índices se crearán automáticamente después de las tablas
      
      console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }
  createTables() {
    const tables = [
      // Tabla de usuarios
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // Tabla de sesiones de usuario
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Tabla de historial de chat
      `CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conversation_id TEXT NOT NULL,
        message_type TEXT CHECK(message_type IN ('user', 'assistant')) NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Tabla de tokens de recuperación de contraseña
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    // Ejecutar creación de tablas de forma síncrona con callback
    let tablesCreated = 0;
    const totalTables = tables.length;

    tables.forEach((tableSQL, index) => {
      this.db.run(tableSQL, (err) => {
        if (err) {
          console.error(`Error creando tabla ${index + 1}:`, err);
          throw err;
        }
        
        tablesCreated++;
        if (tablesCreated === totalTables) {
          // Solo crear índices después de que todas las tablas estén creadas
          this.createIndexes();
        }
      });
    });
  }

  createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_history(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token)',
      'CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at)'
    ];

    indexes.forEach((indexSQL) => {
      this.db.run(indexSQL, (err) => {
        if (err) {
          console.error('Error creando índice:', err);
        }
      });
    });
  }

  // Método para obtener la instancia de la base de datos
  getDatabase() {
    return this.db;
  }

  // Limpieza de sesiones expiradas
  async cleanExpiredSessions() {
    try {
      const result = await this.db.runAsync('DELETE FROM user_sessions WHERE expires_at < datetime("now")');
      if (result.changes > 0) {
        console.log(`🧹 Limpiadas ${result.changes} sesiones expiradas`);
      }
      return result.changes;
    } catch (error) {
      console.error('Error limpiando sesiones expiradas:', error);
      throw error;
    }
  }

  // Limpieza de tokens de recuperación expirados
  async cleanExpiredResetTokens() {
    try {
      const result = await this.db.runAsync('DELETE FROM password_reset_tokens WHERE expires_at < datetime("now") OR used = 1');
      if (result.changes > 0) {
        console.log(`🧹 Limpiados ${result.changes} tokens de recuperación expirados`);
      }
      return result.changes;
    } catch (error) {
      console.error('Error limpiando tokens de recuperación:', error);
      throw error;
    }
  }

  // Limpieza general de datos expirados
  async cleanup() {
    await this.cleanExpiredSessions();
    await this.cleanExpiredResetTokens();
  }

  // Cerrar la conexión
  close() {
    if (this.db) {
      this.db.close();
      console.log('✅ Conexión a la base de datos cerrada');
    }
  }

  // Obtener estadísticas de la base de datos
  async getStats() {
    try {
      const stats = {
        users: await this.db.getAsync('SELECT COUNT(*) as count FROM users'),
        activeSessions: await this.db.getAsync('SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > datetime("now")'),
        totalMessages: await this.db.getAsync('SELECT COUNT(*) as count FROM chat_history'),
        conversations: await this.db.getAsync('SELECT COUNT(DISTINCT conversation_id) as count FROM chat_history')
      };
      
      return {
        users: stats.users.count,
        activeSessions: stats.activeSessions.count,
        totalMessages: stats.totalMessages.count,
        conversations: stats.conversations.count
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

// Instancia singleton
let instance = null;

function getDatabaseManager() {
  if (!instance) {
    instance = new DatabaseManager();
  }
  return instance;
}

module.exports = {
  DatabaseManager,
  getDatabaseManager
};