# Gemini POC

Prueba de concepto mínima para llamar a la API de LLM (Gemini / similar) desde un frontend React y un backend Node.js.

Estructura:

- backend/: servidor Express que mantiene la clave y reenvía la respuesta en streaming
- frontend/: React + Vite UI minimal

Instrucciones:

1. Backend
   - Abrir PowerShell en `d:\PROYECTO ff\gemini-poc\backend`
   - Ejecutar: npm install
   - Copiar `.env.example` a `.env` y poner tu clave en `OPENAI_API_KEY`
   - Iniciar: npm run dev

2. Frontend
   - Abrir PowerShell en `d:\PROYECTO ff\gemini-poc\frontend`
   - Ejecutar: npm install
   - Iniciar: npm run dev

3. Probar
   - Abrir http://localhost:5173 (u otra dirección que indique Vite)
   - Escribir un mensaje y enviar. El backend llamará a la API y el frontend mostrará la respuesta en streaming.

Notas:
- Ajusta `backend/index.js` para usar la URL y formato exacto de Gemini si difiere.
- Por simplicidad este ejemplo reenvía los chunks sin parseo; es fácil cambiar a SSE o a otro formato.
- Mantén tu clave en el servidor, nunca en el frontend.

Licencia: MIT
