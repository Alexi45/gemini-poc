import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './PasswordRecovery.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('Por favor ingresa tu email');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.requestPasswordReset(email);
      
      if (response.success) {
        setMessage('Se han enviado las instrucciones a tu email para resetear tu contraseña.');
        
        // En desarrollo, mostrar el token
        if (response.resetToken) {
          setMessage(prev => `${prev} Token de desarrollo: ${response.resetToken}`);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-recovery-container">
      <div className="password-recovery-form">
        <div className="form-header">
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa tu email y te enviaremos instrucciones para resetear tu contraseña.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="form-footer">
          <button 
            type="button" 
            className="back-link" 
            onClick={onBackToLogin}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
