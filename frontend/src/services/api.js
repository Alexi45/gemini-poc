import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autorización
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      newPassword, 
      confirmPassword 
    });
    return response.data;
  }
};

// Servicios del chat con Gemini
export const chatAPI = {
  sendMessage: async (message, conversationId = null) => {
    console.log('🔗 API: Enviando solicitud a /chat/send');
    console.log('📝 Mensaje:', message);
    console.log('🆔 Conversation ID:', conversationId);
    
    try {
      const response = await api.post('/chat/send', { 
        message,
        conversationId 
      });
      
      console.log('✅ API: Respuesta exitosa:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('📊 Error response:', error.response?.data);
      throw error;
    }
  },
  // Obtener historial de chat (conversaciones)
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Obtener conversación específica
  getConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Buscar en el historial
  searchHistory: async (searchTerm, page = 1, limit = 50) => {
    const response = await api.get(`/chat/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Eliminar conversación
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Exportar conversación
  exportConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/export`);
    return response.data;
  },

  // Obtener estadísticas del chat
  getStats: async () => {
    const response = await api.get('/chat/stats');
    return response.data;
  }
};

// Utilidades para el manejo de tokens
export const tokenUtils = {
  setToken: (token) => {
    localStorage.setItem('auth_token', token);
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  removeToken: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  setUserData: (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
  },

  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

export default api;
