import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, AlertCircle, CheckCircle, XCircle, RotateCcw, Sparkles, MessageCircle, Zap, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import Header from './Header';
import ChatHistory from './ChatHistory';

const Chat = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [messageCount, setMessageCount] = useState(0);  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  // Auto scroll to bottom when messages change or to last AI message if it's long
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Si el último mensaje es de la IA y es largo, hacer scroll al inicio del mensaje
      if (lastMessage.role === 'assistant' && lastMessage.text.length > 200) {
        setTimeout(() => {
          lastMessageRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }, 150);
      } else {
        // Scroll normal al final del chat para mensajes cortos
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }, 100);
      }
    }
  }, [messages, loading, isTyping]);

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/test');
      setConnectionStatus(response.ok ? 'connected' : 'error');
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Función para determinar el tamaño del texto basado en la longitud
  const getMessageTextSize = (text) => {
    if (text.length > 500) return 'text-small';
    if (text.length > 200) return 'text-medium';
    return 'text-normal';
  };
  // Función para formatear texto largo con saltos de línea
  const formatMessageText = (text) => {
    // Dividir por párrafos si hay doble salto de línea
    const paragraphs = text.split(/\n\s*\n/);
    
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, index) => (
        <div key={index} className="message-paragraph">
          {paragraph.trim().split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < paragraph.trim().split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      ));
    }
    
    // Si no hay párrafos, simplemente mostrar el texto con saltos de línea simples
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = {
      role: 'user', 
      text: input, 
      timestamp: new Date(),
      id: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);
    setLoading(true);
    setIsTyping(true);
    
    const currentInput = input;
    setInput('');    try {
      const response = await chatAPI.sendMessage(currentInput, currentConversationId);
      
      setIsTyping(false);
      
      if (response.success) {
        // Guardar el conversation ID si es nuevo
        if (!currentConversationId) {
          setCurrentConversationId(response.data.conversationId);
        }
        
        const assistantMessage = {
          role: 'assistant',
          text: response.data.message,
          timestamp: new Date(),
          id: Date.now() + 1
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setConnectionStatus('connected');
      } else {
        throw new Error(response.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      
      const errorMessage = {
        role: 'assistant',
        text: `Error: ${error.response?.data?.message || error.message || 'No se pudo conectar con el servidor'}`,
        timestamp: new Date(),
        id: Date.now() + 1,
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
  };

  const clearChat = () => {
    setMessages([]);
    setMessageCount(0);
  };

  // Cargar historial desde el modal de historial
  const handleLoadHistory = async () => {
    try {
      const response = await chatAPI.getHistory(50);
      if (response.success) {
        setMessages(response.data.history);
        setMessageCount(response.data.history.filter(msg => msg.role === 'user').length);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  // Función para cargar conversación específica desde historial
  const handleLoadConversation = (conversationData) => {
    // Esta función será llamada desde ChatHistory component
    // Por ahora, simplemente añade el mensaje al chat actual
    const newMessage = {
      role: 'user',
      text: conversationData.text,
      timestamp: conversationData.timestamp,
      id: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageCount(prev => prev + 1);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle size={16} className="status-icon connected" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      case 'disconnected':
        return <XCircle size={16} className="status-icon disconnected" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Error de conexión';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Verificando...';
    }
  };

  return (
    <div className="chat-container">
      <Header />
      
      <div className="chat-content">
        <div className="status-bar">
          <div className="status-info">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>          <div className="chat-stats">
            <MessageCircle size={16} />
            <span>{messageCount} mensajes</span>
            
            <button 
              onClick={() => setShowHistory(true)} 
              className="history-btn" 
              title="Ver historial"
            >
              <History size={16} />
            </button>
            
            {messageCount > 0 && (
              <button onClick={clearChat} className="clear-btn" title="Limpiar chat">
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <div className="welcome-icon">
                <Sparkles size={48} />
              </div>
              <h2>¡Hola, {user?.firstName}! 👋</h2>
              <p>Soy Gemini AI, tu asistente inteligente. ¿En qué puedo ayudarte hoy?</p>
              
              <div className="quick-actions">
                <h3>Acciones rápidas:</h3>
                <div className="quick-buttons">
                  <button onClick={() => handleQuickAction('Explícame qué es la inteligencia artificial')}>
                    <Zap size={16} />
                    ¿Qué es la IA?
                  </button>
                  <button onClick={() => handleQuickAction('Ayúdame a escribir un email profesional')}>
                    <Zap size={16} />
                    Escribir email
                  </button>
                  <button onClick={() => handleQuickAction('Dame consejos para ser más productivo')}>
                    <Zap size={16} />
                    Ser productivo
                  </button>
                  <button onClick={() => handleQuickAction('Cuéntame un dato interesante')}>
                    <Zap size={16} />
                    Dato curioso
                  </button>
                </div>
              </div>
            </div>
          )}          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`message ${message.role} ${message.error ? 'error' : ''} ${getMessageTextSize(message.text)}`}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                ) : (
                  <div className="bot-avatar">
                    <Bot size={20} />
                  </div>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.role === 'user' ? user?.firstName || 'Tú' : 'Gemini AI'}
                  </span>
                  <span className="message-time">
                    <Clock size={12} />
                    {formatTime(message.timestamp)}
                  </span>
                  {/* Indicador de mensaje largo */}
                  {message.text.length > 200 && (
                    <span className="message-length-indicator">
                      {message.text.length} caracteres
                    </span>
                  )}
                </div>
                <div className="message-text">
                  {formatMessageText(message.text)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message assistant typing">
              <div className="message-avatar">
                <div className="bot-avatar">
                  <Bot size={20} />
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">Gemini AI</span>
                  <span className="message-time">
                    <Clock size={12} />
                    {formatTime(new Date())}
                  </span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <span>Escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={loading ? 'Enviando mensaje...' : 'Escribe tu mensaje aquí...'}
              disabled={loading}
              className="message-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`send-button ${loading ? 'loading' : ''}`}
              title="Enviar mensaje (Enter)"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <Send size={20} />
              )}
            </button>          </div>
        </div>
      </div>

      {/* Modal de historial */}
      <ChatHistory 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadHistory={handleLoadConversation}
      />
    </div>
  );
};

export default Chat;
