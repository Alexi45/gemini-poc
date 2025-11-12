import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ConversationSidebar = ({ 
  isOpen, 
  onToggle, 
  currentConversationId, 
  onConversationSelect,
  onNewConversation 
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      if (response.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    onNewConversation();
    setSearchTerm('');
  };

  const handleConversationSelect = (conversation) => {
    onConversationSelect(conversation);
  };

  const handleContextMenu = (e, conversation) => {
    e.preventDefault();
    setSelectedConversation(conversation);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRenameConversation = async (conversationId, newTitle) => {
    try {
      // Implementar API para renombrar conversación
      await chatAPI.renameConversation(conversationId, newTitle);
      loadConversations();
    } catch (error) {
      console.error('Error renombrando conversación:', error);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      try {
        // Implementar API para eliminar conversación
        await chatAPI.deleteConversation(conversationId);
        loadConversations();
        if (currentConversationId === conversationId) {
          onNewConversation(); // Crear nueva conversación si se elimina la actual
        }
      } catch (error) {
        console.error('Error eliminando conversación:', error);
      }
    }
  };

  const handleToggleFavorite = async (conversationId, isFavorite) => {
    try {
      // Implementar API para marcar/desmarcar favoritos
      await chatAPI.toggleFavoriteConversation(conversationId, !isFavorite);
      loadConversations();
    } catch (error) {
      console.error('Error actualizando favorito:', error);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getConversationTitle = (conversation) => {
    return conversation.title || conversation.lastMessage?.substring(0, 30) + '...' || 'Nueva conversación';
  };

  return (
    <>
      {/* Overlay para cerrar sidebar en móvil */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle}></div>
      )}

      {/* Sidebar */}
      <div className={`conversation-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header del sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <MessageSquare size={20} />
            <span>Conversaciones</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={onToggle}
            title={isOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Botón nueva conversación */}
        <div className="sidebar-actions">          <button 
            className="new-conversation-btn btn-wave"
            onClick={handleNewConversation}
          >
            <Plus size={18} />
            <span>Nueva Conversación</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="conversations-list">
          {loading ? (
            <div className="loading-conversations">
              <div className="loading-spinner small"></div>
              <span>Cargando conversaciones...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="no-conversations">
              <MessageSquare size={32} />
              <p>No hay conversaciones</p>
              <small>Inicia una nueva conversación</small>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${
                  currentConversationId === conversation.id ? 'active' : ''
                }`}
                onClick={() => handleConversationSelect(conversation)}
                onContextMenu={(e) => handleContextMenu(e, conversation)}
              >
                <div className="conversation-content">
                  <div className="conversation-header">
                    <span className="conversation-title">
                      {getConversationTitle(conversation)}
                    </span>
                    {conversation.isFavorite && (
                      <Star size={12} className="favorite-icon" />
                    )}
                  </div>
                  
                  <div className="conversation-preview">
                    {conversation.lastMessage?.substring(0, 60)}
                    {conversation.lastMessage?.length > 60 && '...'}
                  </div>
                  
                  <div className="conversation-meta">
                    <span className="conversation-date">
                      <Calendar size={12} />
                      {formatDate(conversation.updatedAt)}
                    </span>
                    <span className="conversation-count">
                      {conversation.messageCount} mensajes
                    </span>
                  </div>
                </div>

                <button 
                  className="conversation-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, conversation);
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del sidebar */}
        <div className="sidebar-footer">
          <div className="user-info-mini">
            <div className="user-avatar-mini">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span>{user?.email?.split('@')[0]}</span>
          </div>
        </div>
      </div>

      {/* Menú contextual */}
      {showContextMenu && selectedConversation && (
        <div 
          className="context-menu"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y 
          }}
          onClick={() => setShowContextMenu(false)}
        >
          <div 
            className="context-menu-item"
            onClick={() => {
              const newTitle = prompt('Nuevo nombre:', getConversationTitle(selectedConversation));
              if (newTitle && newTitle.trim()) {
                handleRenameConversation(selectedConversation.id, newTitle.trim());
              }
              setShowContextMenu(false);
            }}
          >
            <Edit3 size={14} />
            <span>Renombrar</span>
          </div>
          
          <div 
            className="context-menu-item"
            onClick={() => {
              handleToggleFavorite(selectedConversation.id, selectedConversation.isFavorite);
              setShowContextMenu(false);
            }}
          >
            <Star size={14} />
            <span>{selectedConversation.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
          </div>
          
          <div className="context-menu-divider"></div>
          
          <div 
            className="context-menu-item danger"
            onClick={() => {
              handleDeleteConversation(selectedConversation.id);
              setShowContextMenu(false);
            }}
          >
            <Trash2 size={14} />
            <span>Eliminar</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationSidebar;
