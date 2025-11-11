// Test directo de la API de Gemini
const fetch = require('node-fetch');
require('dotenv').config();

async function testGeminiAPI() {
  const API_KEY = process.env.GEMINI_API_KEY;
  console.log('API Key:', API_KEY ? 'Configurada' : 'NO CONFIGURADA');
  
  // URL correcta para listar modelos disponibles
  const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(listModelsUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ API Key válida. Modelos disponibles:');
      data.models.forEach(model => {
        console.log(`- ${model.name}`);
      });
    } else {
      console.error('\n❌ Error con API Key:', data);
    }
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
  }
}

testGeminiAPI();
