# 📚 Guía de Uso - Funcionalidades Avanzadas

## 🔮 Análisis Predictivo

### ¿Qué es?
El análisis predictivo utiliza IA para analizar tus patrones de conversación y sugerirte consultas relevantes.

### Cómo usarlo:
1. Haz clic en el botón de **Sparkles** (✨) en la interfaz
2. El sistema analizará tu historial de conversaciones
3. Verás:
   - **Siguiente consulta predicha**: Qué tipo de pregunta probablemente harás
   - **Consultas sugeridas**: Preguntas relevantes basadas en tu historial
   - **Temas principales**: Los temas más discutidos
   - **Estadísticas**: Hora más activa, engagement, estilo preferido

### Consejos:
- Usa las sugerencias haciendo clic en ellas
- Mientras más uses el chat, mejores serán las predicciones
- El análisis se basa en los últimos 100 mensajes

---

## 📝 Historial de Versiones

### ¿Qué es?
Cada vez que regeneras una respuesta de la IA, se guarda como una nueva versión. Puedes navegar entre todas las versiones.

### Cómo usarlo:
1. En cualquier respuesta de la IA, verás el botón **Historial** (⏱️)
2. Haz clic para abrir el historial de versiones
3. Navega entre versiones con los botones **Anterior/Siguiente**
4. Haz clic en cualquier versión para verla
5. Usa **Comparar** para ver diferencias entre versiones
6. Exporta el historial con el botón **Download**

### Funciones disponibles:
- ✅ Ver todas las versiones generadas
- ✅ Navegar entre versiones (Previous/Next)
- ✅ Saltar a cualquier versión específica
- ✅ Comparar versiones para ver diferencias
- ✅ Exportar historial completo en JSON
- ✅ Ver timestamp y modelo usado en cada versión

---

## 💾 Modo Offline

### ¿Qué es?
La aplicación funciona incluso sin conexión a internet. Los mensajes se guardan localmente y se sincronizan cuando vuelves online.

### Cómo funciona:
1. **Sin conexión**: Los mensajes se guardan en IndexedDB
2. **Cola de sincronización**: Los mensajes esperan ser enviados
3. **Auto-sync**: Cuando vuelves online, se envían automáticamente
4. **Cache inteligente**: Recursos estáticos disponibles offline

### Características:
- ✅ Escribir mensajes sin conexión
- ✅ Sincronización automática
- ✅ Interfaz completa disponible
- ✅ Historial local accesible
- ✅ Notificación cuando vuelves online

### Limitaciones:
- ❌ No puedes recibir respuestas de la IA sin conexión
- ❌ Los mensajes se envían cuando vuelves online
- ℹ️ Se recomienda tener conexión para mejor experiencia

---

## ☁️ Exportar a Google Drive

### ¿Qué es?
Exporta tus conversaciones directamente a Google Drive en formato TXT.

### Configuración inicial:
1. Obtén credenciales de Google Cloud:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto
   - Habilita Google Drive API
   - Crea credenciales OAuth 2.0
   - Copia el Client ID y API Key

2. Configura en el código:
   ```javascript
   // En frontend/src/utils/googleDriveIntegration.js
   const GOOGLE_DRIVE_CONFIG = {
     clientId: 'TU_CLIENT_ID',
     apiKey: 'TU_API_KEY',
     // ...
   };
   ```

### Cómo usarlo:
1. Haz clic en el botón **Exportar** (📥)
2. Selecciona **Google Drive**
3. Autoriza la aplicación (primera vez)
4. La conversación se guarda en tu Drive
5. Recibirás un enlace directo al archivo

### Funciones disponibles:
- ✅ Exportar conversación actual
- ✅ Crear carpetas organizadas
- ✅ Listar archivos recientes
- ✅ Exportar a carpeta específica
- ✅ Obtener enlaces compartibles

---

## 🎤 Comandos de Voz

### Speech-to-Text (Hablar para escribir):
1. Haz clic en el botón del **Micrófono** (🎤)
2. Permite el acceso al micrófono (primera vez)
3. Habla tu mensaje
4. El texto aparecerá en el campo de entrada
5. Haz clic nuevamente para detener

### Text-to-Speech (Escuchar respuestas):
1. Haz clic en el botón de **Volumen** (🔊)
2. Las respuestas de la IA se leerán en voz alta
3. Usa los controles para:
   - Pausar/Reanudar
   - Cambiar velocidad
   - Ajustar tono
   - Controlar volumen

### Configuración de voz:
```javascript
// Velocidad (0.5 - 2.0)
voiceSynthesis.setRate(1.0);

// Tono (0.0 - 2.0)
voiceSynthesis.setPitch(1.0);

// Volumen (0.0 - 1.0)
voiceSynthesis.setVolume(1.0);
```

---

## 📊 Análisis de Sentimientos

### ¿Qué es?
Analiza las emociones en tus conversaciones usando procesamiento de lenguaje natural.

### Cómo usarlo:
1. Haz clic en el botón **Análisis** (📊)
2. Verás el dashboard con:
   - **Sentimiento general**: Positivo/Negativo/Neutral
   - **Estadísticas**: Cantidad de cada tipo
   - **Gráficos de barras**: Distribución visual
   - **Línea de tiempo**: Evolución del sentimiento

### Emociones detectadas:
- 😊 **Positivo**: alegría, satisfacción, entusiasmo
- 😐 **Neutral**: información, preguntas objetivas
- 😟 **Negativo**: frustración, confusión, problemas

### Precisión:
- Análisis basado en palabras clave y emojis
- Confianza mostrada en porcentaje
- Mejora con más mensajes en la conversación

---

## 🔌 Sistema de Plugins

### Plugins disponibles:

#### 1. 🔢 Calculadora
```
/calc 25 * 4 + 10
```
Realiza operaciones matemáticas básicas y avanzadas.

#### 2. 🌐 Traductor
```
/traducir Hello World to es
/traducir Hola Mundo to en
```
Traduce texto a diferentes idiomas.

#### 3. 🔍 Búsqueda Web
```
/buscar React hooks tutorial
```
Abre Google con tu búsqueda.

#### 4. 💻 Generador de Código
```
/code crear una función para ordenar arrays en JavaScript
```
Genera código en diferentes lenguajes.

#### 5. 📝 Resumidor
```
/resumir [tu texto largo aquí]
```
Resume textos largos en puntos clave.

### Crear tu propio plugin:
```javascript
// En frontend/src/utils/pluginSystem.js
pluginManager.registerPlugin({
  name: 'MiPlugin',
  version: '1.0.0',
  description: 'Descripción de mi plugin',
  commands: ['/micomando'],
  execute: async (command, args) => {
    // Tu lógica aquí
    return {
      success: true,
      result: 'Resultado de tu plugin'
    };
  }
});
```

---

## 🎨 Temas y Personalización

### Cambiar tema:
1. Haz clic en el botón del **Sol/Luna** (☀️/🌙)
2. Elige entre:
   - 🌙 Tema Oscuro (predeterminado)
   - ☀️ Tema Claro
   - 🌸 Tema Rosa
   - 🌊 Tema Océano

### Configurar preferencias:
1. Abre **Configuración** (⚙️)
2. Ajusta:
   - Modelo de IA (Flash/Pro/Ultra)
   - Límite de tokens
   - Temperatura (creatividad)
   - Notificaciones
   - Privacidad

---

## 🔗 Compartir Conversaciones

### Generar enlace:
1. Haz clic en **Compartir** (🔗)
2. Se genera un enlace único
3. Copia el enlace
4. Compártelo con quien quieras

### Seguridad:
- ✅ Enlaces expiran en 7 días
- ✅ Solo lectura
- ✅ Guardado en localStorage
- ⚠️ No envía datos al servidor

### Ver conversación compartida:
1. Abre el enlace recibido
2. Verás la conversación completa
3. No podrás modificarla
4. Puedes exportarla

---

## 💡 Consejos y Trucos

### Optimizar rendimiento:
- 🔄 Limpia conversaciones antiguas regularmente
- 💾 Exporta conversaciones importantes
- 🗑️ Elimina versiones innecesarias con `pruneVersions()`

### Mejor experiencia de voz:
- 🎤 Habla claro y despacio
- 🔇 Reduce ruido de fondo
- 🔊 Ajusta velocidad de lectura a tu gusto

### Análisis predictivo efectivo:
- 💬 Mantén conversaciones consistentes
- 📝 Usa temas relacionados
- ⏱️ Chatea regularmente

### Modo offline eficiente:
- 📥 Pre-carga conversaciones importantes
- 💾 Sincroniza cuando tengas buena conexión
- 🔋 Ahorra batería deshabilitando features innecesarias

---

## ❓ Preguntas Frecuentes

### ¿Cuántas versiones puedo guardar?
- Sin límite, pero se recomienda usar `pruneVersions(10)` para mantener solo las últimas 10

### ¿Los datos son privados?
- Sí, todo se guarda en tu navegador (localStorage/IndexedDB)
- Solo la API de Gemini ve tus mensajes

### ¿Funciona en móvil?
- Sí, diseño responsive optimizado
- Voice features funcionan en navegadores compatibles

### ¿Puedo usar mi propia API Key?
- Sí, configúrala en el backend (.env)

### ¿Qué navegadores son compatibles?
- Chrome/Edge: ✅ Todas las features
- Firefox: ✅ Mayoría de features
- Safari: ⚠️ Limitaciones en voice y offline

---

## 🆘 Soporte

¿Necesitas ayuda? Consulta:
- 📖 [README.md](../README.md)
- 🐛 [Issues en GitHub](tu-repo/issues)
- 📧 Contacto: tu-email@ejemplo.com

---

**¡Disfruta de tu experiencia con Gemini AI Chat! 🚀**
