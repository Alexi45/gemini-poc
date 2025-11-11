import React, { useState, useEffect } from 'react';
import { Search, Trash2, Download, Calendar, MessageSquare, X, Loader2 } from 'lucide-react';
import { chatAPI } from '../services/api';

const ChatHistory = ({ isOpen, onClose, onLoadHistory }) => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentTab, setCurrentTab] = useState('recent'); // 'recent' o 'search'

  // Cargar historial al abrir
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadStats();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getHistory(20);
      if (response.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await chatAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;

    try {
      setSearchLoading(true);
      const response = await chatAPI.searchHistory(searchTerm.trim());
      if (response.success) {
        setSearchResults(response.data.results);
        setCurrentTab('search');
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todo tu historial de chat? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await chatAPI.clearHistory();
      if (response.success) {
        setHistory([]);
        setSearchResults([]);
        setStats({ ...stats, totalMessages: 0 });
        alert('Historial eliminado correctamente');
      }
    } catch (error) {
      console.error('Error eliminando historial:', error);
      alert('Error al eliminar el historial');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const loadConversationToChat = (conversationData) => {
    // Encontrar el par de mensajes (usuario y asistente)
    if (onLoadHistory) {
      onLoadHistory([conversationData]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="history-overlay">
      <div className="history-modal">
        <div className="history-header">
          <h2>Historial de Chat</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        {stats && (
          <div className="history-stats">
            <div className="stat-item">
              <MessageSquare size={16} />
              <span>{stats.totalMessages} mensajes</span>
            </div>
            {stats.firstMessage && (
              <div className="stat-item">
                <Calendar size={16} />
                <span>Desde {formatDate(stats.firstMessage)}</span>
              </div>
            )}
          </div>
        )}

        <div className="history-search">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar en conversaciones..."
              className="search-input"
            />
            <button 
              onClick={handleSearch}
              disabled={searchLoading || searchTerm.length < 2}
              className="search-button"
            >
              {searchLoading ? <Loader2 size={16} className="spinner" /> : 'Buscar'}
            </button>
          </div>
        </div>

        <div className="history-tabs">
          <button 
            className={`tab ${currentTab === 'recent' ? 'active' : ''}`}
            onClick={() => setCurrentTab('recent')}
          >
            Recientes
          </button>
          <button 
            className={`tab ${currentTab === 'search' ? 'active' : ''}`}
            onClick={() => setCurrentTab('search')}
            disabled={searchResults.length === 0}
          >
            Búsqueda ({searchResults.length})
          </button>
        </div>

        <div className="history-content">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={32} className="spinner" />
              <span>Cargando historial...</span>
            </div>
          ) : (
            <div className="history-list">
              {currentTab === 'recent' ? (
                history.length > 0 ? (
                  history.map((entry, index) => (
                    entry.role === 'user' && (
                      <div key={entry.id} className="history-entry" onClick={() => loadConversationToChat(entry)}>
                        <div className="entry-content">
                          <div className="entry-message">{entry.text}</div>
                          <div className="entry-time">{formatDate(entry.timestamp)}</div>
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="empty-state">
                    <MessageSquare size={48} />
                    <p>No hay conversaciones guardadas aún</p>
                  </div>
                )
              ) : (
                searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div key={result.id} className="search-result" onClick={() => loadConversationToChat(result)}>
                      <div className="result-content">
                        <div className="result-message">
                          <strong>Pregunta:</strong> {result.message}
                        </div>
                        <div className="result-response">
                          <strong>Respuesta:</strong> {result.response.substring(0, 150)}...
                        </div>
                        <div className="result-time">{formatDate(result.timestamp)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Search size={48} />
                    <p>No se encontraron resultados</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="history-actions">
          <button onClick={handleClearHistory} className="danger-button">
            <Trash2 size={16} />
            Eliminar Historial
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
