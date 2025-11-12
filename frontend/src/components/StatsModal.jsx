import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  Clock, 
  X,
  Star,
  Users,
  Activity
} from 'lucide-react';
import { chatAPI } from '../services/api';

const StatsModal = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getUserStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Error cargando estadísticas');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysActive = () => {
    if (!stats?.first_message_date || !stats?.last_message_date) return 0;
    
    const firstDate = new Date(stats.first_message_date);
    const lastDate = new Date(stats.last_message_date);
    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getActivityLevel = () => {
    const totalMessages = stats?.total_messages || 0;
    const daysActive = calculateDaysActive();
    
    if (daysActive === 0) return { level: 'Nuevo', color: '#6b7280', avgPerDay: 0 };
    
    const avgPerDay = totalMessages / daysActive;
    
    if (avgPerDay > 20) return { level: 'Muy Activo', color: '#10b981', avgPerDay: avgPerDay.toFixed(1) };
    if (avgPerDay > 10) return { level: 'Activo', color: '#3b82f6', avgPerDay: avgPerDay.toFixed(1) };
    if (avgPerDay > 5) return { level: 'Moderado', color: '#f59e0b', avgPerDay: avgPerDay.toFixed(1) };
    return { level: 'Ligero', color: '#ef4444', avgPerDay: avgPerDay.toFixed(1) };
  };

  if (!isOpen) return null;

  return (    <div className="modal-overlay stats-modal-overlay">
      <div className="modal-content stats-modal glass-effect">
        <div className="modal-header">
          <h2 className="gradient-text">
            <BarChart size={24} />
            Estadísticas de Uso
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="stats-loading">
              <div className="loading-spinner"></div>
              <p>Cargando estadísticas...</p>
            </div>
          ) : error ? (
            <div className="stats-error">
              <p>Error: {error}</p>
              <button onClick={loadStats} className="retry-btn">
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div className="stats-content">
              {/* Métricas principales */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">
                    <MessageCircle size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.total_messages || 0}</h3>
                    <p>Total Mensajes</p>
                    <small>{stats?.user_messages || 0} tuyos • {stats?.assistant_messages || 0} de IA</small>
                  </div>
                </div>                <div className="stat-card secondary stats-card">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{stats?.total_conversations || 0}</h3>
                    <p>Conversaciones</p>
                    <small>Creadas hasta ahora</small>
                  </div>
                </div>

                <div className="stat-card accent stats-card">
                  <div className="stat-icon">
                    <Activity size={24} />
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: getActivityLevel().color }}>
                      {getActivityLevel().level}
                    </h3>
                    <p>Nivel de Actividad</p>
                    <small>{getActivityLevel().avgPerDay} mensajes/día</small>
                  </div>
                </div>

                <div className="stat-card stats-card">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{calculateDaysActive()}</h3>
                    <p>Días Activo</p>
                    <small>Desde el primer mensaje</small>
                  </div>
                </div>
              </div>

              {/* Información temporal */}
              <div className="temporal-info">
                <div className="info-row">
                  <span className="info-label">
                    <Clock size={16} />
                    Primer mensaje:
                  </span>
                  <span className="info-value">
                    {formatDate(stats?.first_message_date)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    <Clock size={16} />
                    Último mensaje:
                  </span>
                  <span className="info-value">
                    {formatDate(stats?.last_message_date)}
                  </span>
                </div>
              </div>

              {/* Actividad diaria (si está disponible) */}
              {stats?.daily_activity && stats.daily_activity.length > 0 && (
                <div className="activity-chart">
                  <h4>Actividad de los últimos 30 días</h4>
                  <div className="chart-container">
                    {stats.daily_activity.slice(-7).map((day, index) => (
                      <div key={index} className="chart-bar">
                        <div 
                          className="bar"
                          style={{ 
                            height: `${Math.min((day.message_count / 10) * 100, 100)}%`
                          }}
                          title={`${day.date}: ${day.message_count} mensajes`}
                        ></div>
                        <span className="bar-label">
                          {new Date(day.date).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consejos y motivación */}
              <div className="motivation-section">
                <h4>
                  <TrendingUp size={18} />
                  Insights
                </h4>
                <div className="insights">
                  {stats?.total_messages > 100 && (
                    <div className="insight achievement">
                      <Star size={16} />
                      <span>¡Felicidades! Has enviado más de 100 mensajes</span>
                    </div>
                  )}
                  {stats?.total_conversations > 10 && (
                    <div className="insight achievement">
                      <MessageCircle size={16} />
                      <span>Eres un usuario activo con {stats.total_conversations} conversaciones</span>
                    </div>
                  )}
                  {calculateDaysActive() > 7 && (
                    <div className="insight">
                      <Calendar size={16} />
                      <span>Llevas {calculateDaysActive()} días usando la aplicación</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn secondary">
            Cerrar
          </button>
          {!loading && !error && (
            <button onClick={loadStats} className="btn primary">
              Actualizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
