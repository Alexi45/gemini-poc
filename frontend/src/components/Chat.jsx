import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, AlertCircle, CheckCircle, XCircle, RotateCcw, Sparkles, MessageCircle, Zap, History, Settings as SettingsIcon, FileDown, Share2, BarChart3, GitBranch, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import Header from './Header';
import ChatHistory from './ChatHistory';
import Settings from './Settings';
import VoiceControls from './VoiceControls';
import SentimentAnalysis from './SentimentAnalysis';
import PredictiveSuggestions from './PredictiveSuggestions';
import VersionHistory from './VersionHistory';
import { exportToPDF, exportToTXT } from '../utils/exportUtils';
import { initializeNotifications, notifyMessageReceived, notifyError, notifyLongResponseComplete, notifyConnectionLost, notifyConnectionRestored, notifyExportComplete } from '../utils/notifications';
import { generateShareLink, copyToClipboard } from '../utils/shareUtils';
import pluginManager from '../utils/pluginSystem';
import { ResponseVersionManager } from '../utils/versionManager';
import { PredictiveAnalyzer } from '../utils/predictiveAnalyzer';

const Chat = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [messageCount, setMessageCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSentimentAnalysis, setShowSentimentAnalysis] = useState(false);
  const [versionManager] = useState(() => new ResponseVersionManager());
  const [predictiveAnalyzer] = useState(() => new PredictiveAnalyzer());
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictiveReport, setPredictiveReport] = useState(null);
  const [selectedMessageForVersions, setSelectedMessageForVersions] = useState(null);
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
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/test');
        const newStatus = response.ok ? 'connected' : 'error';
        setConnectionStatus(newStatus);
      } catch (err) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    initializeNotifications();
  }, []);

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
    
    // Verificar si es un comando de plugin
    if (pluginManager.isCommand(input.trim())) {
      const result = await pluginManager.executeCommand(input.trim());
      
      const commandMessage = {
        role: 'user',
        text: input,
        timestamp: new Date(),
        id: Date.now()
      };
      
      const responseMessage = {
        role: 'assistant',
        text: result.result,
        timestamp: new Date(),
        id: Date.now() + 1,
        isCommand: true
      };
      
      setMessages(prev => [...prev, commandMessage, responseMessage]);
      setMessageCount(prev => prev + 1);
      setInput('');
      return;
    }
    
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
      // Obtener configuraciones para el modelo de IA
      const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
      const selectedModel = settings.aiModel || 'gemini-2.5-flash';
      
      const response = await chatAPI.sendMessage(currentInput, currentConversationId, selectedModel);
      
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
        
        // Agregar primera versión al historial de versiones
        const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
        const selectedModel = settings.aiModel || 'gemini-2.5-flash';
        versionManager.addVersion(assistantMessage.id, response.data.message, selectedModel);
        
        // Notificar respuesta recibida
        const preview = response.data.message.substring(0, 100);
        notifyMessageReceived(preview);
        
        // Notificar si es una respuesta larga
        if (response.data.message.length > 500) {
          notifyLongResponseComplete();
        }
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
      
      // Notificar error
      notifyError(errorMessage.text);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
  };

  const clearChat = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el chat actual?')) {
      setMessages([]);
      setMessageCount(0);
    }
  };

  const handleExportPDF = () => {
    if (messages.length === 0) {
      alert('No hay mensajes para exportar');
      return;
    }
    
    exportToPDF(messages, currentConversationId || 'current');
    notifyExportComplete('PDF');
    setShowExportMenu(false);
  };

  const handleExportTXT = () => {
    if (messages.length === 0) {
      alert('No hay mensajes para exportar');
      return;
    }
    
    exportToTXT(messages, currentConversationId || 'current');
    notifyExportComplete('TXT');
    setShowExportMenu(false);
  };

  const handleShareConversation = async () => {
    if (messages.length === 0) {
      alert('No hay mensajes para compartir');
      return;
    }

    const result = await generateShareLink(currentConversationId || 'current', messages);
    
    if (result.success) {
      const copied = await copyToClipboard(result.shareUrl);
      
      if (copied) {
        alert('¡Enlace copiado al portapapeles!');
      } else {
        alert(`Enlace generado: ${result.shareUrl}`);
      }
    } else {
      alert('Error al generar enlace para compartir');
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
  };

  // Análisis predictivo
  const handleShowPredictions = () => {
    if (messages.length === 0) {
      alert('No hay suficiente historial para hacer predicciones');
      return;
    }

    const report = predictiveAnalyzer.generatePredictiveReport(messages);
    setPredictiveReport(report);
    setShowPredictions(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    setInput(suggestion);
    setShowPredictions(false);
  };

  // Historial de versiones
  const handleRegenerateResponse = async (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.role === 'user') return;

    // Encontrar el mensaje del usuario anterior
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    const userMessage = messages[messageIndex - 1];
    
    if (!userMessage || userMessage.role !== 'user') return;

    setLoading(true);
    setIsTyping(true);

    try {
      const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
      const selectedModel = settings.aiModel || 'gemini-2.5-flash';
      
      const response = await chatAPI.sendMessage(userMessage.text, currentConversationId, selectedModel);
      
      setIsTyping(false);
      
      if (response.success) {
        // Agregar nueva versión
        versionManager.addVersion(messageId, response.data.message, selectedModel);
        
        // Actualizar el mensaje en la lista
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: response.data.message }
            : msg
        ));

        notifyMessageReceived('Nueva versión generada');
      }
    } catch (error) {
      console.error('Error regenerando:', error);
      notifyError('Error al regenerar respuesta');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleShowVersionHistory = (messageId) => {
    setSelectedMessageForVersions(messageId);
  };

  const handleUpdateMessageVersion = (messageId, newText) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, text: newText }
        : msg
    ));
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
            
            <button 
              onClick={() => setShowSettings(true)} 
              className="settings-btn" 
              title="Configuraciones"
            >
              <SettingsIcon size={16} />
            </button>
            
            {messageCount > 0 && (
              <>
                <button 
                  onClick={handleShowPredictions} 
                  className="predictions-btn" 
                  title="Análisis predictivo"
                >
                  <Brain size={16} />
                </button>
                
                <button 
                  onClick={() => setShowSentimentAnalysis(true)} 
                  className="sentiment-btn" 
                  title="Análisis de sentimientos"
                >
                  <BarChart3 size={16} />
                </button>
                
                <button 
                  onClick={handleShareConversation} 
                  className="share-btn" 
                  title="Compartir conversación"
                >
                  <Share2 size={16} />
                </button>
                
                <div className="export-menu-container">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)} 
                    className="export-btn" 
                    title="Exportar conversación"
                  >
                    <FileDown size={16} />
                  </button>
                  
                  {showExportMenu && (
                    <div className="export-menu">
                      <button onClick={handleExportPDF}>Exportar PDF</button>
                      <button onClick={handleExportTXT}>Exportar TXT</button>
                    </div>
                  )}
                </div>
                
                <button onClick={clearChat} className="clear-btn" title="Limpiar chat">
                  <RotateCcw size={16} />
                </button>
              </>
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
                
                {/* Botones de versión para mensajes de la IA */}
                {message.role === 'assistant' && !message.error && (
                  <div className="message-actions">
                    <button
                      onClick={() => handleRegenerateResponse(message.id)}
                      className="action-btn"
                      title="Regenerar respuesta"
                      disabled={loading}
                    >
                      <RotateCcw size={14} />
                      Regenerar
                    </button>
                    
                    {versionManager.getVersions(message.id)?.length > 1 && (
                      <button
                        onClick={() => handleShowVersionHistory(message.id)}
                        className="action-btn"
                        title="Ver historial de versiones"
                      >
                        <GitBranch size={14} />
                        Versiones ({versionManager.getVersions(message.id).length})
                      </button>
                    )}
                  </div>
                )}
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
            <VoiceControls 
              onTranscript={handleVoiceTranscript}
              lastMessage={messages[messages.length - 1]}
            />
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
      
      {/* Modal de configuraciones */}
      <Settings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      {/* Modal de análisis de sentimientos */}
      <SentimentAnalysis 
        messages={messages}
        isOpen={showSentimentAnalysis}
        onClose={() => setShowSentimentAnalysis(false)}
      />
      
      {/* Modal de análisis predictivo */}
      {showPredictions && predictiveReport && (
        <PredictiveSuggestions
          report={predictiveReport}
          onClose={() => setShowPredictions(false)}
          onSelectSuggestion={handleSelectSuggestion}
        />
      )}
      
      {/* Modal de historial de versiones */}
      {selectedMessageForVersions && (
        <VersionHistory
          versionManager={versionManager}
          messageId={selectedMessageForVersions}
          onClose={() => setSelectedMessageForVersions(null)}
          onUpdateMessage={handleUpdateMessageVersion}
        />
      )}
    </div>
  );
};

export default Chat;
