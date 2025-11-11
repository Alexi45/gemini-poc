# 🤖 Gemini AI Chat - Aplicación Completa con Autenticación

Una aplicación de chat completa integrada con Gemini 2.5 Flash AI, sistema de autenticación robusto, persistencia de conversaciones y diseño profesional moderno.

## ✨ Características Principales

### 🔐 Sistema de Autenticación Avanzado
- **Registro de usuarios** con validación completa de emails y contraseñas seguras
- **Login seguro** con JWT tokens (7 días de duración)
- **Recuperación de contraseña** con sistema de reset tokens
- **Protección de rutas** con middleware personalizado
- **Base de datos SQLite** para almacenamiento persistente
- **Rate limiting** anti-spam (5 intentos por minuto)
- **Encriptación bcrypt** de contraseñas
- **Sesiones persistentes** con refresh automático

### 🤖 Integración Avanzada con Gemini AI
- **Gemini 2.5 Flash** - El modelo más reciente y rápido de Google
- **Chat en tiempo real** con indicadores de typing
- **Historial persistente** de conversaciones en base de datos
- **Gestión de conversaciones** con IDs únicos
- **Manejo robusto de errores** con reintentos automáticos
- **Rate limiting** para la API de Gemini
- **Monitoreo de conexión** en tiempo real

### 🎨 Interfaz de Usuario Profesional
- **Tema dual** (claro/oscuro) con persistencia
- **Diseño glassmorphism** con efectos modernos
- **Animaciones fluidas** y micro-interacciones
- **Responsive design** optimizado para móviles
- **Scroll inteligente** que se adapta al tamaño de mensajes
- **Texto adaptativo** (diferentes tamaños según longitud)
- **Componentes modulares** con React
- **Iconos profesionales** con Lucide React

### 📊 Funciones Avanzadas del Chat
- **Mensajes con formato inteligente** - Párrafos automáticos para texto largo
- **Scroll automático optimizado** - Va al inicio para respuestas largas de la IA
- **Indicadores visuales** - Estados de conexión, typing, longitud de mensajes
- **Acciones rápidas** - Botones predefinidos para consultas comunes
- **Estadísticas en tiempo real** - Contador de mensajes y tiempo
- **Historial búsqueda** - Acceso rápido a conversaciones anteriores

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** 16+ 
- **npm** o yarn
- **Git** para clonado
- **Clave API de Gemini** de Google AI Studio

### 1. Clonar e Instalar

```bash
# Clonar el repositorio
git clone <repository-url>
cd gemini-poc

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend  
cd ../frontend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```env
# API Key de Gemini AI (requerida)
GEMINI_API_KEY=tu_api_key_aqui

# Configuración JWT (opcional - tiene valores por defecto)
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRE=7d

# Configuración del servidor (opcional)
PORT=4000
```

**🔑 Obtener API Key de Gemini:**
1. Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Cópiala al archivo `.env`

### 3. Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# ✅ Servidor ejecutándose en http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
# ✅ Cliente ejecutándose en http://localhost:5173
```

### 4. Acceso y Prueba

**URLs de acceso:**
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:4000
- 💾 **Base de datos**: SQLite en `backend/database/gemini.db`

**Usuario de prueba (ya creado):**
- 📧 **Email**: `nuevo@test.com`
- 🔒 **Contraseña**: `MiPassword123!`

## 🏗️ Arquitectura del Proyecto

### Backend (Node.js + Express)
```
backend/
├── index.js                 # Servidor principal
├── .env                     # Variables de entorno
├── controllers/
│   ├── authController.js    # Lógica de autenticación
│   └── chatController.js    # Lógica del chat con Gemini
├── models/
│   ├── User.js             # Modelo de usuario
│   └── ChatHistory.js      # Modelo de historial
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   └── chat.js             # Rutas del chat
├── middleware/
│   └── auth.js             # Middleware de autenticación
└── database/
    ├── db.js               # Configuración de SQLite
    └── gemini.db           # Base de datos SQLite
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── App.jsx             # Router principal
│   ├── main.jsx            # Punto de entrada
│   ├── styles.css          # Estilos globales
│   ├── components/
│   │   ├── Chat.jsx        # Componente principal del chat
│   │   ├── Header.jsx      # Cabecera con perfil de usuario
│   │   ├── Login.jsx       # Formulario de login
│   │   ├── Register.jsx    # Formulario de registro
│   │   ├── ChatHistory.jsx # Modal de historial
│   │   └── ThemeSelector.jsx # Selector de tema
│   ├── context/
│   │   ├── AuthContext.jsx # Contexto de autenticación
│   │   └── ThemeContext.jsx # Contexto del tema
│   └── services/
│       └── api.js          # Servicios de API
└── package.json
```

## 🔧 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión  
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Resetear contraseña
- `GET /api/auth/me` - Obtener perfil del usuario

### Chat
- `POST /api/chat/send` - Enviar mensaje a Gemini
- `GET /api/chat/history` - Obtener historial de conversaciones
- `GET /api/chat/conversations` - Listar conversaciones

## 🎯 Funcionalidades Destacadas

### Sistema de Mensajes Inteligente
- **Texto adaptativo**: Los mensajes largos se muestran con texto más pequeño
- **Scroll optimizado**: Para respuestas largas de la IA, scroll al inicio del mensaje  
- **Formateo automático**: Párrafos y saltos de línea respetados
- **Indicadores visuales**: Longitud del mensaje, estado de typing, timestamps

### Gestión de Estado
- **Persistencia de tema**: Se mantiene entre sesiones
- **Autenticación automática**: Tokens JWT con renovación
- **Estado de conexión**: Monitoreo en tiempo real del backend
- **Historial local**: Mensajes guardados durante la sesión

### Experiencia de Usuario
- **Acciones rápidas**: Botones predefinidos para consultas comunes
- **Feedback visual**: Loading states, animaciones, transiciones
- **Responsive**: Funciona perfectamente en móviles
- **Accesibilidad**: Navegación por teclado, contrastes apropiados

## 🔒 Seguridad Implementada

- ✅ **Autenticación JWT** con tokens seguros
- ✅ **Rate limiting** en todas las rutas críticas  
- ✅ **Validación de entrada** en frontend y backend
- ✅ **Encriptación de contraseñas** con bcrypt
- ✅ **Sanitización de datos** para prevenir XSS
- ✅ **Middleware de protección** en rutas privadas
- ✅ **Gestión segura de API keys** (nunca en el cliente)

## 🚀 Estado del Proyecto

**✅ COMPLETADO - Aplicación totalmente funcional**

### Funcionalidades Implementadas:
- ✅ Sistema completo de autenticación con JWT
- ✅ Recuperación de contraseña funcional
- ✅ Chat completo con Gemini 2.5 Flash
- ✅ Persistencia de conversaciones en SQLite
- ✅ Interfaz profesional con tema dual
- ✅ Scroll inteligente y texto adaptativo
- ✅ Manejo robusto de errores
- ✅ Rate limiting y seguridad completa
- ✅ Responsive design optimizado
- ✅ Indicadores de estado en tiempo real

### Próximas Mejoras Sugeridas:
- 🔄 Sistema de notificaciones push
- 🔄 Exportar conversaciones (PDF/TXT)  
- 🔄 Búsqueda en historial de conversaciones
- 🔄 Configuraciones de usuario avanzadas
- 🔄 Integración con múltiples modelos de IA
- 🔄 Sistema de plugins/extensiones

## 📞 Soporte y Contacto

- **Documentación**: Este README
- **Issues**: Reportar bugs o solicitar features
- **Contribuciones**: Pull requests bienvenidos

## 📄 Licencia

MIT License - Siéntete libre de usar este código para tus propios proyectos.

---

**Desarrollado con ❤️ usando React, Node.js y Gemini AI**

*Última actualización: Noviembre 2024*
