import React from 'react';
import { ChevronLeft, ChevronRight, X, Download, GitCompare } from 'lucide-react';

const VersionHistory = ({ versionManager, messageId, onClose, onUpdateMessage }) => {
  const versions = versionManager.getVersions(messageId);
  const navInfo = versionManager.getNavigationInfo(messageId);

  if (!versions || versions.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    versionManager.previousVersion(messageId);
    const current = versionManager.getCurrentVersion(messageId);
    onUpdateMessage(messageId, current.text);
  };

  const handleNext = () => {
    versionManager.nextVersion(messageId);
    const current = versionManager.getCurrentVersion(messageId);
    onUpdateMessage(messageId, current.text);
  };

  const handleGoToVersion = (index) => {
    versionManager.goToVersion(messageId, index);
    const current = versionManager.getCurrentVersion(messageId);
    onUpdateMessage(messageId, current.text);
  };

  const handleExportHistory = () => {
    const history = versionManager.exportVersionHistory(messageId);
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version_history_${messageId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompare = () => {
    const comparison = versionManager.compareVersions(messageId);
    alert(`Comparación de versiones:\n\n${JSON.stringify(comparison, null, 2)}`);
  };

  return (
    <div className="version-history-overlay" onClick={onClose}>
      <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="version-header">
          <h3>Historial de Versiones</h3>
          <div className="version-actions">
            <button onClick={handleCompare} title="Comparar versiones">
              <GitCompare size={18} />
            </button>
            <button onClick={handleExportHistory} title="Exportar historial">
              <Download size={18} />
            </button>
            <button onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="version-navigation">
          <button 
            onClick={handlePrevious} 
            disabled={!navInfo.hasPrevious}
            className="nav-btn"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>

          <div className="version-counter">
            <span className="current-version">{navInfo.currentIndex + 1}</span>
            <span className="version-separator">/</span>
            <span className="total-versions">{navInfo.total}</span>
          </div>

          <button 
            onClick={handleNext} 
            disabled={!navInfo.hasNext}
            className="nav-btn"
          >
            Siguiente
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="versions-list">
          {versions.map((version, index) => (
            <div 
              key={index}
              className={`version-item ${index === navInfo.currentIndex ? 'active' : ''}`}
              onClick={() => handleGoToVersion(index)}
            >
              <div className="version-info">
                <span className="version-number">Versión {index + 1}</span>
                <span className="version-timestamp">
                  {new Date(version.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="version-text">
                {version.text.substring(0, 100)}
                {version.text.length > 100 ? '...' : ''}
              </div>
              <div className="version-meta">
                {version.model && <span className="version-model">{version.model}</span>}
                <span className="version-length">{version.text.length} caracteres</span>
              </div>
            </div>
          ))}
        </div>

        <div className="version-footer">
          <p className="version-hint">
            Haz clic en cualquier versión para verla o usa los botones de navegación
          </p>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
