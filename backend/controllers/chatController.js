const { getChatHistoryInstance } = require('../models/ChatHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatController = {
  // Enviar mensaje y obtener respuesta
  async sendMessage(req, res) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user.id;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'El mensaje es obligatorio'
        });
      }

      const chatHistory = getChatHistoryInstance();
      let currentConversationId = conversationId;

      // Si no hay conversation ID, crear nueva conversación
      if (!currentConversationId) {
        const newConversation = chatHistory.startConversation(userId, message);
        currentConversationId = newConversation.conversationId;
      } else {
        // Verificar que la conversación pertenece al usuario
        if (!chatHistory.verifyConversationOwnership(userId, currentConversationId)) {
          return res.status(403).json({
            success: false,
            message: 'No tienes acceso a esta conversación'
          });
        }

        // Agregar mensaje del usuario
        chatHistory.addMessage(userId, currentConversationId, 'user', message);
      }

      // Obtener historial de la conversación para contexto
      const conversation = chatHistory.getConversation(userId, currentConversationId, 10);
      
      try {
        // Preparar el modelo de Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Crear contexto de la conversación
        let prompt = message;
        if (conversation.length > 1) {
          const context = conversation
            .slice(-6) // Últimos 6 mensajes para contexto
            .map(msg => `${msg.message_type === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
            .join('\n');
          prompt = `Contexto de la conversación:\n${context}\n\nNuevo mensaje del usuario: ${message}`;
        }

        // Generar respuesta con Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const assistantMessage = response.text();

        // Guardar respuesta del asistente
        const savedResponse = chatHistory.addMessage(
          userId, 
          currentConversationId, 
          'assistant', 
          assistantMessage
        );

        res.json({
          success: true,
          data: {
            message: assistantMessage,
            conversationId: currentConversationId,
            timestamp: savedResponse.timestamp
          }
        });

      } catch (geminiError) {
        console.error('Error con Gemini AI:', geminiError);
        
        // Respuesta de fallback
        const fallbackMessage = 'Lo siento, estoy teniendo dificultades para procesar tu mensaje en este momento. ¿Podrías intentarlo de nuevo?';
        
        const savedResponse = chatHistory.addMessage(
          userId, 
          currentConversationId, 
          'assistant', 
          fallbackMessage
        );

        res.json({
          success: true,
          data: {
            message: fallbackMessage,
            conversationId: currentConversationId,
            timestamp: savedResponse.timestamp,
            isError: true
          }
        });
      }

    } catch (error) {
      console.error('Error en sendMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener conversaciones del usuario
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const chatHistory = getChatHistoryInstance();
      const conversations = chatHistory.getUserConversations(userId, page, limit);

      res.json({
        success: true,
        data: {
          conversations,
          page,
          hasMore: conversations.length === limit
        }
      });
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una conversación específica
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'ID de conversación es obligatorio'
        });
      }

      const chatHistory = getChatHistoryInstance();

      // Verificar que la conversación pertenece al usuario
      if (!chatHistory.verifyConversationOwnership(userId, conversationId)) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      const messages = chatHistory.getConversation(userId, conversationId);
      const stats = chatHistory.getConversationStats(userId, conversationId);

      res.json({
        success: true,
        data: {
          conversationId,
          messages,
          stats
        }
      });
    } catch (error) {
      console.error('Error obteniendo conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Buscar en mensajes
  async searchMessages(req, res) {
    try {
      const { query } = req.query;
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'La búsqueda debe tener al menos 2 caracteres'
        });
      }

      const chatHistory = getChatHistoryInstance();
      const results = chatHistory.searchMessages(userId, query.trim(), page, limit);

      res.json({
        success: true,
        data: {
          results,
          query: query.trim(),
          page,
          hasMore: results.length === limit
        }
      });
    } catch (error) {
      console.error('Error buscando mensajes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar conversación
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'ID de conversación es obligatorio'
        });
      }

      const chatHistory = getChatHistoryInstance();

      // Verificar que la conversación pertenece al usuario
      if (!chatHistory.verifyConversationOwnership(userId, conversationId)) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      const deleted = chatHistory.deleteConversation(userId, conversationId);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Conversación eliminada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'No se pudo eliminar la conversación'
        });
      }
    } catch (error) {
      console.error('Error eliminando conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas del usuario
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const chatHistory = getChatHistoryInstance();
      const stats = chatHistory.getUserStats(userId);

      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Exportar conversación
  async exportConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'ID de conversación es obligatorio'
        });
      }

      const chatHistory = getChatHistoryInstance();

      // Verificar que la conversación pertenece al usuario
      if (!chatHistory.verifyConversationOwnership(userId, conversationId)) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      const exportData = chatHistory.exportConversation(userId, conversationId);

      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      console.error('Error exportando conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = chatController;
