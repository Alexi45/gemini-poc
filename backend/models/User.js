const db = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, password, firstName, lastName } = userData;
      
      db.run(
        `INSERT INTO users (username, email, password, firstName, lastName) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, email, password, firstName, lastName],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, email, firstName, lastName });
          }
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? AND isActive = 1',
        [email],
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

  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ? AND isActive = 1',
        [username],
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

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, firstName, lastName, avatar, lastLogin, createdAt FROM users WHERE id = ? AND isActive = 1',
        [id],
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

  static async updateLastLogin(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
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

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
