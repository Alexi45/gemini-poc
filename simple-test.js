const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Probando login...');
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'nuevo@test.com',
      password: 'MiPassword123!'
    });
    console.log('Login exitoso:', response.data.success);
    console.log('Token recibido:', !!response.data.data.token);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

simpleTest();
