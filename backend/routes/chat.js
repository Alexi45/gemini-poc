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

// Crear nueva conversación
router.post('/conversations/new', chatController.createNewConversation);

// Obtener conversación específica
router.get('/conversations/:conversationId', chatController.getConversation);

// Renombrar conversación - FASE 2
router.put('/conversations/:conversationId/rename', chatController.renameConversation);

// Marcar/desmarcar como favorita - FASE 2
router.put('/conversations/:conversationId/favorite', chatController.toggleFavoriteConversation);

// Eliminar conversación
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Exportar conversación
router.get('/conversations/:conversationId/export', chatController.exportConversation);

// Buscar en mensajes
router.get('/search', chatController.searchMessages);

// Buscar en conversaciones - FASE 2
router.get('/search/conversations', chatController.searchConversations);

// Obtener estadísticas del usuario
router.get('/stats', chatController.getUserStats);

module.exports = router;
