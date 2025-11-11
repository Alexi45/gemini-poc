import React, { useState } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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

        <div className="header-user">
          <div 
            className="user-dropdown"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-info">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <span>{getInitials(user?.firstName, user?.lastName)}</span>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName} {user?.lastName}
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
    </header>
  );
};

export default Header;
