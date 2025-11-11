import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './PasswordRecovery.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de reseteo no válido');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al resetear la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="password-recovery-container">
        <div className="password-recovery-form">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Contraseña Actualizada</h2>
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            <p>Serás redirigido al inicio de sesión en unos segundos...</p>
            <button onClick={() => navigate('/login')} className="submit-btn">
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-recovery-container">
      <div className="password-recovery-form">
        <div className="form-header">
          <h2>Resetear Contraseña</h2>
          <p>Ingresa tu nueva contraseña.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Ingresa tu nueva contraseña"
              required
              disabled={isLoading}
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirma tu nueva contraseña"
              required
              disabled={isLoading}
              minLength="6"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading || !token}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>

        <div className="form-footer">
          <button 
            type="button" 
            className="back-link" 
            onClick={() => navigate('/login')}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
