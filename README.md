# 🤖 Gemini AI Chat POC con Autenticación

## ✨ Características Principales

### 🔐 Sistema de Autenticación Completo
- **Registro de usuarios** con validación completa
- **Login seguro** con JWT tokens
- **Protección de rutas** con middleware personalizado
- **Base de datos SQLite** para almacenamiento de usuarios
- **Gestión de sesiones** con tokens expiración automática
- **Rate limiting** para prevenir ataques de fuerza bruta
- **Encriptación de contraseñas** con bcrypt

### 🤖 Integración con Gemini AI
- **API Gemini 2.0 Flash** completamente integrada
- **Chat en tiempo real** con respuestas de IA
- **Historial de conversaciones** (preparado para implementar)
- **Manejo de errores** robusto
- **Indicadores de estado** de conexión

### 🎨 Interfaz de Usuario Profesional
- **Diseño dark theme** moderno con glassmorphism
- **Animaciones fluidas** y transiciones suaves
- **Responsive design** para móviles y desktop
- **Componentes reutilizables** con React
- **Iconos profesionales** con Lucide React
- **Loading states** y feedback visual

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+
- npm o yarn

### 1. Configurar el Backend
```bash
cd backend
npm install
```

### 2. Configurar el Frontend
```bash
cd frontend
npm install
```

### 3. Ejecutar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Acceder a la aplicación
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## ⭐ Estado del Proyecto

**✅ COMPLETADO** - Sistema completo de autenticación y chat con Gemini AI funcionando

### Lo que está funcionando:
- ✅ Registro e inicio de sesión completo
- ✅ Base de datos SQLite con tablas creadas
- ✅ JWT tokens funcionando correctamente
- ✅ Chat con Gemini 2.0 Flash API integrado
- ✅ Interfaz de usuario profesional y responsiva
- ✅ Protección de rutas y middleware de seguridad
- ✅ Manejo de errores y estados de loading
- ✅ Rate limiting y seguridad implementada

### URLs de la aplicación:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Base de datos**: SQLite local en `backend/database/gemini.db`

¡El proyecto está listo para usar y probar! 🎉

3. Probar
   - Abrir http://localhost:5173 (u otra dirección que indique Vite)
   - Escribir un mensaje y enviar. El backend llamará a la API y el frontend mostrará la respuesta en streaming.

Notas:
- Ajusta `backend/index.js` para usar la URL y formato exacto de Gemini si difiere.
- Por simplicidad este ejemplo reenvía los chunks sin parseo; es fácil cambiar a SSE o a otro formato.
- Mantén tu clave en el servidor, nunca en el frontend.

Licencia: MIT
