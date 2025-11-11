import React, { useState } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from './ThemeSelector';

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Debug: verificar datos del usuario
  console.log('Header user data:', user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };  const getInitials = (email) => {
    if (!email) return 'U';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
  }; 

  const getDisplayName = (email) => {
    if (!email) return 'Usuario';
    return email.split('@')[0];
  };

  const getAvatarColor = (email) => {
    if (!email) return '#3b82f6';
    
    // Generar un color basado en el email
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convertir el hash a un color HSL
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  return (
    <header className="chat-header">
      <div className="header-content">
        <div className="header-title">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            <span className="logo-text">Gemini AI Chat</span>
          </div>
        </div>

        <div className="header-actions">
          <ThemeSelector />
          
          <div className="header-user">
            <div 
              className="user-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-info">                <div className="user-avatar" style={{ background: getAvatarColor(user?.email) }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={getDisplayName(user.email)} />
                  ) : (
                    <span>{getInitials(user?.email)}</span>
                  )}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {getDisplayName(user?.email)}
                  </span>
                  <span className="user-email">
                    {user?.email}
                  </span>
                  <span className="user-username">@{user?.username}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`dropdown-icon ${dropdownOpen ? 'open' : ''}`} 
                />
              </div>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    <User size={18} />
                    <span>Perfil</span>
                  </div>
                  <div className="dropdown-item">
                    <Settings size={18} />
                    <span>Configuración</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
