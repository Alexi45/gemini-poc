import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, X, BarChart3, Smile, Frown, Meh } from 'lucide-react';
import { analyzeConversationSentiment, getSentimentEmoji, getSentimentColor, getSentimentText } from '../utils/sentimentAnalysis';

const SentimentAnalysis = ({ messages, isOpen, onClose }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (isOpen && messages && messages.length > 0) {
      const result = analyzeConversationSentiment(messages);
      setAnalysis(result);
    }
  }, [isOpen, messages]);

  if (!isOpen || !analysis) return null;

  const { overall, stats, timeline } = analysis;
  const total = stats.total;

  return (
    <div className="sentiment-overlay">
      <div className="sentiment-modal">
        <div className="sentiment-header">
          <h2><BarChart3 size={24} /> Análisis de Sentimientos</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="sentiment-content">
          {/* Resumen general */}
          <div className="sentiment-summary">
            <div className="overall-sentiment">
              <div className="sentiment-icon" style={{ color: getSentimentColor(overall) }}>
                {getSentimentEmoji(overall)}
              </div>
              <div className="sentiment-info">
                <h3>Sentimiento General</h3>
                <p style={{ color: getSentimentColor(overall) }}>
                  {getSentimentText(overall)}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="sentiment-stats">
            <div className="stat-card positive">
              <Smile size={24} />
              <div className="stat-info">
                <span className="stat-value">{stats.positive}</span>
                <span className="stat-label">Positivos</span>
                <span className="stat-percentage">
                  {total > 0 ? Math.round((stats.positive / total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="stat-card neutral">
              <Meh size={24} />
              <div className="stat-info">
                <span className="stat-value">{stats.neutral}</span>
                <span className="stat-label">Neutrales</span>
                <span className="stat-percentage">
                  {total > 0 ? Math.round((stats.neutral / total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="stat-card negative">
              <Frown size={24} />
              <div className="stat-info">
                <span className="stat-value">{stats.negative}</span>
                <span className="stat-label">Negativos</span>
                <span className="stat-percentage">
                  {total > 0 ? Math.round((stats.negative / total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="sentiment-chart">
            <h3>Distribución de Sentimientos</h3>
            <div className="chart-bars">
              <div className="bar-item">
                <div className="bar-label">Positivo</div>
                <div className="bar-container">
                  <div 
                    className="bar bar-positive" 
                    style={{ width: total > 0 ? `${(stats.positive / total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="bar-value">{stats.positive}</div>
              </div>

              <div className="bar-item">
                <div className="bar-label">Neutral</div>
                <div className="bar-container">
                  <div 
                    className="bar bar-neutral" 
                    style={{ width: total > 0 ? `${(stats.neutral / total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="bar-value">{stats.neutral}</div>
              </div>

              <div className="bar-item">
                <div className="bar-label">Negativo</div>
                <div className="bar-container">
                  <div 
                    className="bar bar-negative" 
                    style={{ width: total > 0 ? `${(stats.negative / total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="bar-value">{stats.negative}</div>
              </div>
            </div>
          </div>

          {/* Línea de tiempo */}
          <div className="sentiment-timeline">
            <h3>Evolución del Sentimiento</h3>
            <div className="timeline-list">
              {timeline
                .filter(item => item.role === 'user')
                .slice(-10)
                .map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div 
                      className="timeline-dot" 
                      style={{ background: getSentimentColor(item.sentiment) }}
                    >
                      {getSentimentEmoji(item.sentiment)}
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-sentiment" style={{ color: getSentimentColor(item.sentiment) }}>
                        {getSentimentText(item.sentiment)}
                      </span>
                      <span className="timeline-confidence">
                        {item.confidence}% confianza
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sentiment-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        .sentiment-modal {
          background: var(--card-background);
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
          border: 1px solid var(--border-color);
        }

        .sentiment-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sentiment-header h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .sentiment-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .sentiment-summary {
          margin-bottom: 24px;
        }

        .overall-sentiment {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .sentiment-icon {
          font-size: 3rem;
        }

        .sentiment-info h3 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }

        .sentiment-info p {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .sentiment-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .stat-card.positive {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .stat-card.neutral {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
        }

        .stat-card.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .stat-info {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
        }

        .stat-label {
          display: block;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .stat-percentage {
          display: block;
          font-size: 0.85rem;
          margin-top: 4px;
          opacity: 0.7;
        }

        .sentiment-chart {
          margin-bottom: 24px;
        }

        .sentiment-chart h3 {
          margin: 0 0 16px 0;
          color: var(--text-primary);
        }

        .chart-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bar-label {
          width: 80px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .bar-container {
          flex: 1;
          height: 24px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          transition: width 0.5s ease;
          border-radius: 12px;
        }

        .bar-positive {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .bar-neutral {
          background: linear-gradient(90deg, #64748b, #94a3b8);
        }

        .bar-negative {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .bar-value {
          width: 40px;
          text-align: right;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sentiment-timeline h3 {
          margin: 0 0 16px 0;
          color: var(--text-primary);
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .timeline-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-sentiment {
          font-weight: 600;
        }

        .timeline-confidence {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .sentiment-modal {
            width: 95%;
          }

          .sentiment-stats {
            grid-template-columns: 1fr;
          }

          .bar-label {
            width: 60px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SentimentAnalysis;
