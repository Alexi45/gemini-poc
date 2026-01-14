import React from 'react';
import { Sparkles, TrendingUp, Clock, Target, X } from 'lucide-react';

const PredictiveSuggestions = ({ report, onClose, onSelectSuggestion }) => {
  if (!report) return null;

  const getQueryTypeIcon = (type) => {
    const icons = {
      question: '❓',
      command: '⚡',
      creative: '🎨',
      technical: '💻',
      casual: '💬'
    };
    return icons[type] || '💡';
  };

  return (
    <div className="predictive-suggestions-overlay" onClick={onClose}>
      <div className="predictive-suggestions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="predictive-header">
          <div className="predictive-title">
            <Sparkles size={24} />
            <h2>Análisis Predictivo</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="predictive-content">
          {/* Próximo tipo de consulta predicha */}
          <div className="prediction-section">
            <div className="section-header">
              <Target size={18} />
              <h3>Siguiente Consulta Predicha</h3>
            </div>
            <div className="predicted-type">
              <span className="type-icon">{getQueryTypeIcon(report.predictedNextQueryType)}</span>
              <span className="type-name">{report.predictedNextQueryType}</span>
              <span className="confidence">{(report.typeConfidence * 100).toFixed(0)}% confianza</span>
            </div>
          </div>

          {/* Sugerencias de consultas */}
          <div className="prediction-section">
            <div className="section-header">
              <Sparkles size={18} />
              <h3>Consultas Sugeridas</h3>
            </div>
            <div className="suggestions-list">
              {report.suggestedQueries.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => onSelectSuggestion(suggestion.query)}
                >
                  <div className="suggestion-content">
                    <span className="suggestion-icon">{getQueryTypeIcon(suggestion.type)}</span>
                    <span className="suggestion-text">{suggestion.query}</span>
                  </div>
                  <div className="suggestion-meta">
                    <span className="relevance">{(suggestion.relevance * 100).toFixed(0)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Temas principales */}
          <div className="prediction-section">
            <div className="section-header">
              <TrendingUp size={18} />
              <h3>Temas Principales</h3>
            </div>
            <div className="topics-grid">
              {report.topTopics.map((topic, index) => (
                <div key={index} className="topic-card">
                  <div className="topic-name">{topic.topic}</div>
                  <div className="topic-count">{topic.count} menciones</div>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="prediction-section">
            <div className="section-header">
              <Clock size={18} />
              <h3>Estadísticas</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Hora más activa</div>
                <div className="stat-value">{report.mostActiveHour}:00</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Engagement</div>
                <div className="stat-value">{(report.engagementScore * 100).toFixed(0)}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Estilo preferido</div>
                <div className="stat-value">{report.preferredStyle}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Complejidad predicha</div>
                <div className="stat-value">{report.predictedResponseComplexity}</div>
              </div>
            </div>
          </div>

          {/* Frases comunes */}
          {report.commonPhrases && report.commonPhrases.length > 0 && (
            <div className="prediction-section">
              <div className="section-header">
                <h3>Frases Comunes</h3>
              </div>
              <div className="phrases-list">
                {report.commonPhrases.map((phrase, index) => (
                  <div key={index} className="phrase-item">
                    <span className="phrase-text">"{phrase.phrase}"</span>
                    <span className="phrase-count">{phrase.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveSuggestions;
