import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-icon">
          <AlertTriangle size={64} className="text-warning" />
        </div>
        
        <h1 className="error-title">404</h1>
        <h2 className="error-subtitle">Página no encontrada</h2>
        
        <p className="error-message">
          Lo siento, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <div className="error-actions">
          <Link to="/chat" className="btn btn-primary">
            <Home size={20} />
            Volver al Chat
          </Link>
          
          <Link to="/login" className="btn btn-outline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
