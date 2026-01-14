/**
 * Sistema de notificaciones push del navegador
 */

// Verificar si el navegador soporta notificaciones
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Solicitar permiso para mostrar notificaciones
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Este navegador no soporta notificaciones');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error solicitando permiso de notificaciones:', error);
    return 'denied';
  }
};

// Verificar si tenemos permiso para notificaciones
export const hasNotificationPermission = () => {
  if (!isNotificationSupported()) return false;
  return Notification.permission === 'granted';
};

// Mostrar notificación
export const showNotification = (title, options = {}) => {
  if (!hasNotificationPermission()) {
    console.warn('No hay permiso para mostrar notificaciones');
    return null;
  }

  const defaultOptions = {
    icon: '/gemini-icon.png',
    badge: '/badge-icon.png',
    vibrate: [200, 100, 200],
    tag: 'gemini-chat',
    renotify: true,
    requireInteraction: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Auto-cerrar después de 5 segundos si no se especifica lo contrario
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (error) {
    console.error('Error mostrando notificación:', error);
    return null;
  }
};

// Tipos de notificaciones predefinidas
export const notificationTypes = {
  MESSAGE_RECEIVED: {
    title: '💬 Nueva respuesta de Gemini AI',
    icon: '🤖',
    body: 'Gemini ha respondido a tu mensaje',
    tag: 'message-received'
  },
  ERROR: {
    title: '⚠️ Error en el chat',
    icon: '❌',
    body: 'Hubo un problema al procesar tu solicitud',
    tag: 'error'
  },
  LONG_RESPONSE: {
    title: '✅ Respuesta completada',
    icon: '📝',
    body: 'Gemini ha terminado de generar una respuesta larga',
    tag: 'long-response'
  },
  CONNECTION_LOST: {
    title: '🔌 Conexión perdida',
    icon: '⚠️',
    body: 'Se perdió la conexión con el servidor',
    tag: 'connection-lost'
  },
  CONNECTION_RESTORED: {
    title: '✅ Conexión restaurada',
    icon: '✓',
    body: 'La conexión con el servidor se ha restablecido',
    tag: 'connection-restored'
  },
  EXPORT_COMPLETE: {
    title: '📥 Exportación completada',
    icon: '✓',
    body: 'Tu conversación se ha exportado correctamente',
    tag: 'export-complete'
  }
};

// Notificar mensaje recibido
export const notifyMessageReceived = (messagePreview = '') => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  const body = messagePreview 
    ? `${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`
    : notificationTypes.MESSAGE_RECEIVED.body;

  showNotification(notificationTypes.MESSAGE_RECEIVED.title, {
    body,
    tag: notificationTypes.MESSAGE_RECEIVED.tag,
    icon: '/gemini-icon.png'
  });

  if (settings.soundEnabled) {
    playNotificationSound();
  }
};

// Notificar error
export const notifyError = (errorMessage = '') => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  const body = errorMessage || notificationTypes.ERROR.body;

  showNotification(notificationTypes.ERROR.title, {
    body,
    tag: notificationTypes.ERROR.tag,
    requireInteraction: true
  });
};

// Notificar respuesta larga completada
export const notifyLongResponseComplete = () => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  showNotification(notificationTypes.LONG_RESPONSE.title, {
    body: notificationTypes.LONG_RESPONSE.body,
    tag: notificationTypes.LONG_RESPONSE.tag
  });

  if (settings.soundEnabled) {
    playNotificationSound();
  }
};

// Notificar pérdida de conexión
export const notifyConnectionLost = () => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  showNotification(notificationTypes.CONNECTION_LOST.title, {
    body: notificationTypes.CONNECTION_LOST.body,
    tag: notificationTypes.CONNECTION_LOST.tag,
    requireInteraction: true
  });
};

// Notificar conexión restaurada
export const notifyConnectionRestored = () => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  showNotification(notificationTypes.CONNECTION_RESTORED.title, {
    body: notificationTypes.CONNECTION_RESTORED.body,
    tag: notificationTypes.CONNECTION_RESTORED.tag
  });
};

// Notificar exportación completada
export const notifyExportComplete = (format = 'PDF') => {
  const settings = getUserSettings();
  if (!settings.notificationsEnabled) return;

  showNotification(notificationTypes.EXPORT_COMPLETE.title, {
    body: `Tu conversación se ha exportado como ${format}`,
    tag: notificationTypes.EXPORT_COMPLETE.tag
  });
};

// Reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    // Crear un beep corto usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.value = 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.error('Error reproduciendo sonido:', error);
  }
};

// Obtener configuraciones del usuario
const getUserSettings = () => {
  try {
    const settings = localStorage.getItem('user_settings');
    return settings ? JSON.parse(settings) : {
      notificationsEnabled: true,
      soundEnabled: false
    };
  } catch {
    return {
      notificationsEnabled: true,
      soundEnabled: false
    };
  }
};

// Inicializar notificaciones en la app
export const initializeNotifications = async () => {
  const settings = getUserSettings();
  
  if (settings.notificationsEnabled && isNotificationSupported()) {
    const permission = await requestNotificationPermission();
    return permission === 'granted';
  }
  
  return false;
};

export default {
  isNotificationSupported,
  requestNotificationPermission,
  hasNotificationPermission,
  showNotification,
  notifyMessageReceived,
  notifyError,
  notifyLongResponseComplete,
  notifyConnectionLost,
  notifyConnectionRestored,
  notifyExportComplete,
  initializeNotifications
};
