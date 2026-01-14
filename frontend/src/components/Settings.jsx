import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, X, Moon, Sun, Zap, Bell, Lock, User, Database, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  
  // Estados para configuraciones
  const [settings, setSettings] = useState({
    // Preferencias generales
    language: 'es',
    notificationsEnabled: true,
    soundEnabled: false,
    
    // Configuración de IA
    aiModel: 'gemini-2.5-flash',
    maxTokens: 2048,
    temperature: 0.7,
    
    // Privacidad
    saveHistory: true,
    autoDelete: false,
    autoDeleteDays: 30,
    
    // Interfaz
    compactMode: false,
    showTimestamps: true,
    animationsEnabled: true
  });

  const [saved, setSaved] = useState(false);

  // Cargar configuraciones guardadas
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todas las configuraciones a sus valores predeterminados?')) {
      const defaultSettings = {
        language: 'es',
        notificationsEnabled: true,
        soundEnabled: false,
        aiModel: 'gemini-2.5-flash',
        maxTokens: 2048,
        temperature: 0.7,
        saveHistory: true,
        autoDelete: false,
        autoDeleteDays: 30,
        compactMode: false,
        showTimestamps: true,
        animationsEnabled: true
      };
      setSettings(defaultSettings);
      localStorage.setItem('user_settings', JSON.stringify(defaultSettings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2><SettingsIcon size={24} /> Configuraciones</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* Sección: Apariencia */}
          <div className="settings-section">
            <h3><Moon size={18} /> Apariencia</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Tema</span>
                <small>Cambia entre modo claro y oscuro</small>
              </div>
              <button 
                onClick={toggleTheme}
                className="theme-toggle-btn"
              >
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'dark' ? 'Oscuro' : 'Claro'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Modo compacto</span>
                <small>Reduce el espaciado en la interfaz</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => handleChange('compactMode', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Mostrar marcas de tiempo</span>
                <small>Muestra la hora en cada mensaje</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showTimestamps}
                  onChange={(e) => handleChange('showTimestamps', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Animaciones</span>
                <small>Habilita transiciones suaves</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.animationsEnabled}
                  onChange={(e) => handleChange('animationsEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Sección: Modelo de IA */}
          <div className="settings-section">
            <h3><Sparkles size={18} /> Modelo de IA</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Modelo Gemini</span>
                <small>Selecciona el modelo de IA a usar</small>
              </div>
              <select
                value={settings.aiModel}
                onChange={(e) => handleChange('aiModel', e.target.value)}
                className="settings-select"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido)</option>
                <option value="gemini-pro">Gemini Pro (Avanzado)</option>
                <option value="gemini-ultra">Gemini Ultra (Premium)</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Longitud máxima de respuesta</span>
                <small>Tokens máximos: {settings.maxTokens}</small>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={settings.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                className="settings-range"
              />
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Creatividad</span>
                <small>Temperatura: {settings.temperature}</small>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="settings-range"
              />
            </div>
          </div>

          {/* Sección: Notificaciones */}
          <div className="settings-section">
            <h3><Bell size={18} /> Notificaciones</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Notificaciones push</span>
                <small>Recibe notificaciones del navegador</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Sonidos</span>
                <small>Reproduce sonidos de notificación</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Sección: Privacidad y Datos */}
          <div className="settings-section">
            <h3><Database size={18} /> Privacidad y Datos</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Guardar historial</span>
                <small>Almacena tus conversaciones</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.saveHistory}
                  onChange={(e) => handleChange('saveHistory', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>Auto-eliminar historial</span>
                <small>Elimina conversaciones antiguas automáticamente</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoDelete}
                  onChange={(e) => handleChange('autoDelete', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {settings.autoDelete && (
              <div className="setting-item">
                <div className="setting-label">
                  <span>Eliminar después de</span>
                  <small>{settings.autoDeleteDays} días</small>
                </div>
                <select
                  value={settings.autoDeleteDays}
                  onChange={(e) => handleChange('autoDeleteDays', parseInt(e.target.value))}
                  className="settings-select"
                >
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>
            )}
          </div>

          {/* Sección: Idioma */}
          <div className="settings-section">
            <h3><User size={18} /> Preferencias</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Idioma</span>
                <small>Idioma de la interfaz</small>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="settings-select"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={handleReset} className="reset-button">
            Restablecer
          </button>
          <button 
            onClick={handleSave} 
            className={`save-button ${saved ? 'saved' : ''}`}
          >
            <Save size={16} />
            {saved ? 'Guardado!' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings-overlay {
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

        .settings-modal {
          background: var(--bg-primary);
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .settings-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .settings-header h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .settings-section {
          margin-bottom: 32px;
        }

        .settings-section h3 {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--accent-primary);
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-label {
          flex: 1;
        }

        .setting-label span {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .setting-label small {
          display: block;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .settings-select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.95rem;
          min-width: 180px;
        }

        .settings-range {
          width: 180px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 28px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: var(--accent-primary);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-toggle-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .settings-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .reset-button,
        .save-button {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .reset-button {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .reset-button:hover {
          background: #ff4444;
          color: white;
        }

        .save-button {
          background: var(--accent-primary);
          color: white;
        }

        .save-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .save-button.saved {
          background: #10b981;
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
      `}</style>
    </div>
  );
};

export default Settings;
