// Controlador de Chat simplificado para debug
console.log('Iniciando carga del controlador...');

const { getChatHistoryInstance } = require('../models/ChatHistory');
console.log('ChatHistory cargado...');

const { GoogleGenerativeAI } = require('@google/generative-ai');
console.log('GoogleGenerativeAI cargado...');

const { v4: uuidv4 } = require('uuid');
console.log('UUID cargado...');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('GenAI inicializado...');

const chatController = {
  sendMessage: async (req, res) => {
    console.log('sendMessage llamado');
    res.json({ success: true, message: 'Test' });
  }
};

console.log('Exportando controlador...');
module.exports = chatController;
