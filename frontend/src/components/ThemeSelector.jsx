import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const themes = [
    {
      key: 'light',
      name: 'Claro',
      icon: Sun,
      action: setLightTheme,
      description: 'Tema claro'
    },
    {
      key: 'dark',
      name: 'Oscuro',
      icon: Moon,
      action: setDarkTheme,
      description: 'Tema oscuro'
    },
    {
      key: 'system',
      name: 'Sistema',
      icon: Monitor,
      action: setSystemTheme,
      description: 'Seguir preferencias del sistema'
    }
  ];

  const getCurrentTheme = () => {
    return themes.find(t => t.key === theme) || themes[1]; // Default to dark
  };

  const handleThemeSelect = (themeAction) => {
    themeAction();
    setDropdownOpen(false);
  };

  return (
    <div className="theme-selector">
      {/* Botón rápido de toggle */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        title={`Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Selector avanzado */}
      <div className="theme-dropdown">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="theme-dropdown-trigger"
          title="Seleccionar tema"
        >
          <Palette size={18} />
          <ChevronDown 
            size={14} 
            className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="theme-dropdown-menu">
            <div className="theme-dropdown-header">
              <Palette size={16} />
              <span>Elegir tema</span>
            </div>
            
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.key || 
                (themeOption.key === 'system' && !localStorage.getItem('app_theme'));

              return (
                <button
                  key={themeOption.key}
                  onClick={() => handleThemeSelect(themeOption.action)}
                  className={`theme-option ${isSelected ? 'selected' : ''}`}
                >
                  <Icon size={16} />
                  <div className="theme-option-content">
                    <span className="theme-option-name">{themeOption.name}</span>
                    <span className="theme-option-desc">{themeOption.description}</span>
                  </div>
                  {isSelected && (
                    <div className="theme-selected-indicator">
                      <div className="indicator-dot"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;
