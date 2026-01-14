/**
 * Sistema de compartir conversaciones
 */

// Generar enlace compartido
export const generateShareLink = async (conversationId, messages) => {
  try {
    // Crear un ID único para compartir
    const shareId = generateUniqueId();
    
    // Guardar en localStorage (en producción esto iría al backend)
    const sharedConversations = JSON.parse(localStorage.getItem('shared_conversations') || '{}');
    sharedConversations[shareId] = {
      conversationId,
      messages,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    };
    
    localStorage.setItem('shared_conversations', JSON.stringify(sharedConversations));
    
    // Generar URL
    const shareUrl = `${window.location.origin}/shared/${shareId}`;
    
    return {
      success: true,
      shareId,
      shareUrl
    };
  } catch (error) {
    console.error('Error generando enlace:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtener conversación compartida
export const getSharedConversation = (shareId) => {
  try {
    const sharedConversations = JSON.parse(localStorage.getItem('shared_conversations') || '{}');
    const conversation = sharedConversations[shareId];
    
    if (!conversation) {
      return {
        success: false,
        error: 'Conversación no encontrada'
      };
    }
    
    // Verificar si expiró
    if (new Date(conversation.expiresAt) < new Date()) {
      return {
        success: false,
        error: 'El enlace ha expirado'
      };
    }
    
    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('Error obteniendo conversación compartida:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Copiar al portapapeles
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback para navegadores antiguos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Generar ID único
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  generateShareLink,
  getSharedConversation,
  copyToClipboard
};
