const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testChatFlow() {
  console.log('🧪 Iniciando pruebas de chat con Gemini 2.5 Flash...\n');

  try {
    // 1. Login
    console.log('1️⃣ Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'nuevo@test.com',
      password: 'MiPassword123!'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login falló: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');

    // 2. Enviar mensaje a Gemini
    console.log('\n2️⃣ Enviando mensaje a Gemini AI...');
    const chatResponse = await axios.post(`${BASE_URL}/chat/send`, {
      message: 'Hola, ¿puedes explicarme qué es la inteligencia artificial en una frase corta?'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatResponse.data.success) {
      throw new Error('Chat falló: ' + chatResponse.data.message);
    }

    console.log('✅ Respuesta de Gemini recibida:');
    console.log('📝 Mensaje:', chatResponse.data.data.message);
    console.log('🆔 Conversación ID:', chatResponse.data.data.conversationId);

    // 3. Enviar segundo mensaje en la misma conversación
    console.log('\n3️⃣ Enviando segundo mensaje en la misma conversación...');
    const chatResponse2 = await axios.post(`${BASE_URL}/chat/send`, {
      message: '¿Puedes darme un ejemplo práctico?',
      conversationId: chatResponse.data.data.conversationId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatResponse2.data.success) {
      throw new Error('Segundo mensaje falló: ' + chatResponse2.data.message);
    }

    console.log('✅ Segunda respuesta de Gemini recibida:');
    console.log('📝 Mensaje:', chatResponse2.data.data.message);

    // 4. Obtener historial de conversaciones
    console.log('\n4️⃣ Obteniendo historial de conversaciones...');
    const conversationsResponse = await axios.get(`${BASE_URL}/chat/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!conversationsResponse.data.success) {
      throw new Error('Obtener conversaciones falló: ' + conversationsResponse.data.message);
    }

    console.log('✅ Conversaciones obtenidas:', conversationsResponse.data.data.conversations.length);

    console.log('\n🎉 ¡Todas las pruebas de chat pasaron exitosamente!');
    console.log('✨ Gemini 2.5 Flash está funcionando correctamente');
    console.log('🚀 La aplicación está lista para usar');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('📝 Detalles del error:', error.response.data);
    }
  }
}

testChatFlow();
