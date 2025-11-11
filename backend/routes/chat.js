const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Enviar mensaje y obtener respuesta
router.post('/send', chatController.sendMessage);

// Obtener lista de conversaciones
router.get('/conversations', chatController.getConversations);

// Obtener conversación específica
router.get('/conversations/:conversationId', chatController.getConversation);

// Eliminar conversación
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Exportar conversación
router.get('/conversations/:conversationId/export', chatController.exportConversation);

// Buscar en mensajes
router.get('/search', chatController.searchMessages);

// Obtener estadísticas del usuario
router.get('/stats', chatController.getUserStats);

module.exports = router;
