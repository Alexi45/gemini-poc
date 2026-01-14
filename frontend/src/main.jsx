import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Registrar Service Worker para modo offline (DESHABILITADO TEMPORALMENTE)
// Descomentar cuando esté listo para producción
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration);
        
        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nueva versión disponible. Recarga la página.');
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error registrando Service Worker:', error);
      });
  });
}
*/

createRoot(document.getElementById('root')).render(<App />)


