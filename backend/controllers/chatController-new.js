const { getChatHistoryInstance } = require('../models/ChatHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sendMessage = async (req, res) => {
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
    let currentConversationId = conversationId || uuidv4();

    await chatHistory.addMessage(userId, currentConversationId, 'user', message);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(message);
      const assistantMessage = result.response.text();

      await chatHistory.addMessage(userId, currentConversationId, 'assistant', assistantMessage);

      res.json({
        success: true,
        data: {
          message: assistantMessage,
          conversationId: currentConversationId
        }
      });

    } catch (geminiError) {
      console.error('Error con Gemini AI:', geminiError);
      
      const fallbackMessage = 'Lo siento, hay un problema técnico. Intenta de nuevo.';
      await chatHistory.addMessage(userId, currentConversationId, 'assistant', fallbackMessage);

      res.json({
        success: true,
        data: {
          message: fallbackMessage,
          conversationId: currentConversationId,
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
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatHistory = getChatHistoryInstance();
    const conversations = await chatHistory.getUserConversations(userId, 1, 20);

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Error en getConversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const chatHistory = getChatHistoryInstance();
    const messages = await chatHistory.getConversation(userId, conversationId);

    res.json({
      success: true,
      data: { conversationId, messages }
    });
  } catch (error) {
    console.error('Error en getConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { q: query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    const chatHistory = getChatHistoryInstance();
    const results = await chatHistory.searchMessages(userId, query);

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Error en searchMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const chatHistory = getChatHistoryInstance();
    const deleted = await chatHistory.deleteConversation(userId, conversationId);

    res.json({
      success: deleted,
      message: deleted ? 'Conversación eliminada' : 'No encontrada'
    });
  } catch (error) {
    console.error('Error en deleteConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const exportConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const chatHistory = getChatHistoryInstance();
    const messages = await chatHistory.getConversation(userId, conversationId);

    res.json({
      success: true,
      data: { conversationId, messages }
    });
  } catch (error) {
    console.error('Error en exportConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatHistory = getChatHistoryInstance();

    const conversations = await chatHistory.getUserConversations(userId, 1, 100);
    const totalMessages = await chatHistory.getTotalUserMessages(userId);

    res.json({
      success: true,
      data: {
        totalConversations: conversations.length,
        totalMessages: totalMessages || 0
      }
    });
  } catch (error) {
    console.error('Error en getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  searchMessages,
  deleteConversation,
  exportConversation,
  getUserStats
};
