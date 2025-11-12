const { v4: uuidv4 } = require('uuid');
const { getDatabaseManager } = require('../database/db');

class ChatHistory {
  constructor() {
    this.db = getDatabaseManager().getDatabase();
  }

  // Agregar nuevo mensaje
  async addMessage(userId, conversationId, messageType, content, metadata = null) {
    try {
      if (!['user', 'assistant'].includes(messageType)) {
        throw new Error('Tipo de mensaje inválido');
      }      const metadataString = metadata ? JSON.stringify(metadata) : null;
      
      const insertPromise = new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO chat_history (user_id, conversation_id, message_type, content, timestamp, metadata)
          VALUES (?, ?, ?, ?, datetime('now'), ?)
        `, [userId, conversationId, messageType, content, metadataString], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastInsertRowid: this.lastID });
          }
        });
      });
      
      const result = await insertPromise;

      return {
        id: result.lastInsertRowid,
        userId,
        conversationId,
        messageType,
        content,
        metadata,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en ChatHistory.addMessage:', error);
      throw error;
    }
  }

  // Crear nueva conversación
  async startConversation(userId, initialMessage) {
    try {
      const conversationId = uuidv4();
      
      // Agregar el primer mensaje
      const message = await this.addMessage(userId, conversationId, 'user', initialMessage);
      
      return {
        conversationId,
        message
      };
    } catch (error) {
      console.error('Error en ChatHistory.startConversation:', error);
      throw error;
    }
  }

  // Obtener conversación completa
  async getConversation(userId, conversationId, limit = null) {
    try {
      let sql = `
        SELECT * FROM chat_history 
        WHERE user_id = ? AND conversation_id = ?
        ORDER BY timestamp ASC
      `;
      let params = [userId, conversationId];

      if (limit) {
        sql = `
          SELECT * FROM (
            SELECT * FROM chat_history 
            WHERE user_id = ? AND conversation_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
          ) ORDER BY timestamp ASC
        `;
        params = [userId, conversationId, limit];
      }

      const messages = await this.db.allAsync(sql, params);

      return messages.map(msg => ({
        ...msg,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null
      }));
    } catch (error) {
      console.error('Error en ChatHistory.getConversation:', error);
      throw error;
    }
  }

  // Obtener lista de conversaciones del usuario
  async getUserConversations(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const conversations = await this.db.allAsync(`
        SELECT 
          conversation_id,
          COUNT(*) as message_count,
          MIN(timestamp) as started_at,
          MAX(timestamp) as last_message_at,
          SUBSTR(content, 1, 100) as preview
        FROM chat_history 
        WHERE user_id = ? AND message_type = 'user'
        GROUP BY conversation_id
        ORDER BY last_message_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
      
      return conversations.map(conv => ({
        ...conv,
        preview: conv.preview.length > 97 ? conv.preview + '...' : conv.preview
      }));
    } catch (error) {
      console.error('Error en ChatHistory.getUserConversations:', error);
      throw error;
    }
  }

  // Buscar mensajes
  async searchMessages(userId, query, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const searchTerm = `%${query}%`;
      const results = await this.db.allAsync(`
        SELECT 
          conversation_id,
          message_type,
          content,
          timestamp
        FROM chat_history 
        WHERE user_id = ? AND content LIKE ? 
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `, [userId, searchTerm, limit, offset]);
      
      return results.map(result => ({
        ...result,
        content: this.highlightSearchTerm(result.content, query),
        metadata: result.metadata ? JSON.parse(result.metadata) : null
      }));
    } catch (error) {
      console.error('Error en ChatHistory.searchMessages:', error);
      throw error;
    }
  }

  // Resaltar término de búsqueda en el contenido
  highlightSearchTerm(content, term) {
    const regex = new RegExp(`(${term})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }

  // Eliminar conversación
  async deleteConversation(userId, conversationId) {
    try {
      // Primero eliminar todos los mensajes de la conversación
      const deleteMessagesPromise = new Promise((resolve, reject) => {
        this.db.run(`
          DELETE FROM chat_history 
          WHERE user_id = ? AND conversation_id = ?
        `, [userId, conversationId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });

      await deleteMessagesPromise;

      // Luego eliminar la conversación de la tabla de conversaciones (si existe)
      const deleteConversationPromise = new Promise((resolve, reject) => {
        this.db.run(`
          DELETE FROM conversations 
          WHERE id = ? AND user_id = ?
        `, [conversationId, userId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });

      await deleteConversationPromise;

      return { success: true, message: 'Conversación eliminada' };
    } catch (error) {
      console.error('Error en deleteConversation:', error);
      throw error;
    }
  }

  // Obtener estadísticas de una conversación
  async getConversationStats(userId, conversationId) {
    try {
      const stats = await this.db.getAsync(`
        SELECT 
          conversation_id,
          COUNT(*) as total_messages,
          COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
          COUNT(CASE WHEN message_type = 'assistant' THEN 1 END) as assistant_messages,
          MIN(timestamp) as started_at,
          MAX(timestamp) as last_message_at
        FROM chat_history 
        WHERE user_id = ? AND conversation_id = ?
        GROUP BY conversation_id
      `, [userId, conversationId]);
      return stats || null;
    } catch (error) {
      console.error('Error en ChatHistory.getConversationStats:', error);
      throw error;
    }
  }

  // Obtener estadísticas totales del usuario
  async getUserStats(userId) {
    try {
      const statsPromise = new Promise((resolve, reject) => {
        this.db.get(`
          SELECT 
            COUNT(DISTINCT conversation_id) as total_conversations,
            COUNT(*) as total_messages,
            COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN message_type = 'assistant' THEN 1 END) as assistant_messages,
            MIN(timestamp) as first_message_date,
            MAX(timestamp) as last_message_date
          FROM chat_history 
          WHERE user_id = ?
        `, [userId], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || {});
          }
        });
      });

      const stats = await statsPromise;

      // Obtener conversaciones por día en los últimos 30 días
      const activityPromise = new Promise((resolve, reject) => {
        this.db.all(`
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as message_count
          FROM chat_history 
          WHERE user_id = ? 
            AND timestamp >= datetime('now', '-30 days')
          GROUP BY DATE(timestamp)
          ORDER BY date ASC
        `, [userId], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });

      const activity = await activityPromise;

      return {
        ...stats,
        daily_activity: activity
      };
    } catch (error) {
      console.error('Error en getUserStats:', error);
      throw error;
    }
  }

  // Obtener total de mensajes del usuario
  async getTotalUserMessages(userId) {
    try {
      const result = await this.db.getAsync(`
        SELECT COUNT(*) as total 
        FROM chat_history 
        WHERE user_id = ?
      `, [userId]);
      
      return result ? result.total : 0;
    } catch (error) {
      console.error('Error en ChatHistory.getTotalUserMessages:', error);
      throw error;
    }
  }

  // Verificar si una conversación pertenece al usuario
  async verifyConversationOwnership(userId, conversationId) {
    try {
      const message = await this.db.getAsync(
        'SELECT id FROM chat_history WHERE user_id = ? AND conversation_id = ? LIMIT 1',
        [userId, conversationId]
      );
      
      return !!message;
    } catch (error) {
      console.error('Error en ChatHistory.verifyConversationOwnership:', error);
      throw error;
    }
  }

  // Exportar conversación (para backup o migración)
  async exportConversation(userId, conversationId) {
    try {
      const messages = await this.getConversation(userId, conversationId);
      const stats = await this.getConversationStats(userId, conversationId);
      
      return {
        conversationId,
        userId,
        stats,
        messages,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en ChatHistory.exportConversation:', error);
      throw error;
    }
  }

  // Limpiar conversaciones antiguas (opcional, para mantenimiento)
  async cleanOldConversations(userId, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await this.db.runAsync(`
        DELETE FROM chat_history 
        WHERE user_id = ? AND timestamp < datetime(?)
      `, [userId, cutoffDate.toISOString()]);
      
      return result.changes;
    } catch (error) {
      console.error('Error en ChatHistory.cleanOldConversations:', error);
      throw error;
    }
  }

  // Renombrar conversación - FASE 2
  async renameConversation(userId, conversationId, newTitle) {
    try {
      const updatePromise = new Promise((resolve, reject) => {
        this.db.run(`
          UPDATE conversations 
          SET title = ?, updated_at = datetime('now')
          WHERE id = ? AND user_id = ?
        `, [newTitle, conversationId, userId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });

      const result = await updatePromise;
      
      if (result.changes === 0) {
        throw new Error('Conversación no encontrada');
      }

      return { success: true, message: 'Conversación renombrada' };
    } catch (error) {
      console.error('Error en renameConversation:', error);
      throw error;
    }
  }

  // Marcar/desmarcar conversación como favorita - FASE 2
  async toggleFavoriteConversation(userId, conversationId, isFavorite) {
    try {
      const updatePromise = new Promise((resolve, reject) => {
        this.db.run(`
          UPDATE conversations 
          SET is_favorite = ?, updated_at = datetime('now')
          WHERE id = ? AND user_id = ?
        `, [isFavorite ? 1 : 0, conversationId, userId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });

      const result = await updatePromise;
      
      if (result.changes === 0) {
        throw new Error('Conversación no encontrada');
      }

      return { success: true, isFavorite };
    } catch (error) {
      console.error('Error en toggleFavoriteConversation:', error);
      throw error;
    }
  }

  // Buscar en conversaciones - FASE 2
  async searchConversations(userId, searchTerm, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const searchPromise = new Promise((resolve, reject) => {
        this.db.all(`
          SELECT DISTINCT 
            conversation_id,
            content,
            timestamp,
            message_type
          FROM chat_history 
          WHERE user_id = ? 
            AND (content LIKE ? OR content LIKE ?)
          ORDER BY timestamp DESC 
          LIMIT ? OFFSET ?
        `, [
          userId, 
          `%${searchTerm}%`, 
          `%${searchTerm.toLowerCase()}%`, 
          limit, 
          offset
        ], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });

      const results = await searchPromise;

      return {
        results,
        page,
        limit,
        total: results.length
      };
    } catch (error) {
      console.error('Error en searchConversations:', error);
      throw error;
    }
  }
}

// Instancia singleton
let chatHistoryInstance = null;

function getChatHistoryInstance() {
  if (!chatHistoryInstance) {
    chatHistoryInstance = new ChatHistory();
  }
  return chatHistoryInstance;
}

module.exports = {
  ChatHistory,
  getChatHistoryInstance
};