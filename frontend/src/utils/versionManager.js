/**
 * Sistema de versionado de respuestas de IA
 * Permite guardar y navegar entre múltiples versiones de una misma respuesta
 */

export class ResponseVersionManager {
  constructor() {
    this.versions = new Map(); // messageId -> versiones[]
    this.currentVersionIndex = new Map(); // messageId -> índice actual
  }

  /**
   * Agregar una nueva versión de respuesta
   */
  addVersion(messageId, responseText, metadata = {}) {
    if (!this.versions.has(messageId)) {
      this.versions.set(messageId, []);
      this.currentVersionIndex.set(messageId, 0);
    }

    const versions = this.versions.get(messageId);
    const version = {
      id: `${messageId}-v${versions.length + 1}`,
      text: responseText,
      timestamp: new Date().toISOString(),
      version: versions.length + 1,
      metadata: {
        model: metadata.model || 'gemini-2.5-flash',
        tokens: metadata.tokens || 0,
        temperature: metadata.temperature || 0.7,
        ...metadata
      }
    };

    versions.push(version);
    this.currentVersionIndex.set(messageId, versions.length - 1);

    return version;
  }

  /**
   * Obtener todas las versiones de un mensaje
   */
  getVersions(messageId) {
    return this.versions.get(messageId) || [];
  }

  /**
   * Obtener la versión actual
   */
  getCurrentVersion(messageId) {
    const versions = this.versions.get(messageId);
    const index = this.currentVersionIndex.get(messageId);
    
    if (!versions || index === undefined) return null;
    
    return versions[index];
  }

  /**
   * Navegar a la versión anterior
   */
  previousVersion(messageId) {
    const currentIndex = this.currentVersionIndex.get(messageId) || 0;
    if (currentIndex > 0) {
      this.currentVersionIndex.set(messageId, currentIndex - 1);
      return this.getCurrentVersion(messageId);
    }
    return null;
  }

  /**
   * Navegar a la versión siguiente
   */
  nextVersion(messageId) {
    const versions = this.versions.get(messageId) || [];
    const currentIndex = this.currentVersionIndex.get(messageId) || 0;
    
    if (currentIndex < versions.length - 1) {
      this.currentVersionIndex.set(messageId, currentIndex + 1);
      return this.getCurrentVersion(messageId);
    }
    return null;
  }

  /**
   * Ir a una versión específica
   */
  goToVersion(messageId, versionNumber) {
    const versions = this.versions.get(messageId) || [];
    const index = versionNumber - 1;
    
    if (index >= 0 && index < versions.length) {
      this.currentVersionIndex.set(messageId, index);
      return versions[index];
    }
    return null;
  }

  /**
   * Obtener información de navegación
   */
  getNavigationInfo(messageId) {
    const versions = this.versions.get(messageId) || [];
    const currentIndex = this.currentVersionIndex.get(messageId) || 0;
    
    return {
      total: versions.length,
      current: currentIndex + 1,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < versions.length - 1
    };
  }

  /**
   * Comparar dos versiones
   */
  compareVersions(messageId, version1, version2) {
    const versions = this.versions.get(messageId) || [];
    const v1 = versions[version1 - 1];
    const v2 = versions[version2 - 1];
    
    if (!v1 || !v2) return null;
    
    return {
      version1: v1,
      version2: v2,
      lengthDiff: v2.text.length - v1.text.length,
      timeDiff: new Date(v2.timestamp) - new Date(v1.timestamp),
      modelDiff: v1.metadata.model !== v2.metadata.model
    };
  }

  /**
   * Exportar historial de versiones
   */
  exportVersionHistory(messageId) {
    const versions = this.versions.get(messageId) || [];
    
    return {
      messageId,
      totalVersions: versions.length,
      versions: versions.map(v => ({
        ...v,
        length: v.text.length
      })),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Limpiar versiones antiguas (mantener solo las últimas N)
   */
  pruneVersions(messageId, keepLast = 5) {
    const versions = this.versions.get(messageId);
    if (!versions || versions.length <= keepLast) return;
    
    const pruned = versions.slice(-keepLast);
    this.versions.set(messageId, pruned);
    
    const currentIndex = this.currentVersionIndex.get(messageId) || 0;
    const newIndex = Math.min(currentIndex, pruned.length - 1);
    this.currentVersionIndex.set(messageId, Math.max(0, newIndex));
  }
}

// Instancia global
export const versionManager = new ResponseVersionManager();

export default versionManager;
