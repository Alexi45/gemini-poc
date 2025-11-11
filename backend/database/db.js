const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear directorio de la base de datos si no existe
const dbPath = path.join(__dirname, 'gemini.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear tabla de usuarios
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      firstName VARCHAR(50) NOT NULL,
      lastName VARCHAR(50) NOT NULL,
      avatar TEXT DEFAULT NULL,
      isActive BOOLEAN DEFAULT 1,
      lastLogin DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla users:', err.message);
    } else {
      console.log('✅ Tabla users creada o ya existe');
    }
  });

  // Crear tabla de sesiones para logout distribuido
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token VARCHAR(500) NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla user_sessions:', err.message);
    } else {
      console.log('✅ Tabla user_sessions creada o ya existe');
    }
  });

  // Crear tabla de chat_history
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla chat_history:', err.message);
    } else {
      console.log('✅ Tabla chat_history creada o ya existe');
    }
  });
});

module.exports = db;
