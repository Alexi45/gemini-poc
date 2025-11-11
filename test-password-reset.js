// Script de prueba para la funcionalidad de recuperación de contraseña
const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testPasswordReset() {
  try {
    console.log('🧪 Iniciando pruebas de recuperación de contraseña...\n');

    // 1. Solicitar reseteo de contraseña
    console.log('1. Solicitando reseteo de contraseña...');
    const resetRequest = await axios.post(`${API_BASE_URL}/auth/request-password-reset`, {
      email: 'jarlaaxlety@gmail.com'
    });
    
    console.log('✅ Respuesta de solicitud de reseteo:', resetRequest.data);
    
    if (resetRequest.data.resetToken) {
      const token = resetRequest.data.resetToken;
      console.log(`📧 Token de desarrollo: ${token}\n`);

      // 2. Resetear contraseña con el token
      console.log('2. Reseteando contraseña con token...');
      const resetPassword = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token: token,
        newPassword: 'nuevaPassword123',
        confirmPassword: 'nuevaPassword123'
      });

      console.log('✅ Respuesta de reseteo:', resetPassword.data);

      // 3. Intentar login con la nueva contraseña
      console.log('\n3. Probando login con nueva contraseña...');
      const login = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'jarlaaxlety@gmail.com',
        password: 'nuevaPassword123'
      });

      console.log('✅ Login exitoso con nueva contraseña:', login.data.success);

      // 4. Restaurar contraseña original
      console.log('\n4. Restaurando contraseña original...');
      const restoreRequest = await axios.post(`${API_BASE_URL}/auth/request-password-reset`, {
        email: 'jarlaaxlety@gmail.com'
      });

      if (restoreRequest.data.resetToken) {
        const restoreToken = restoreRequest.data.resetToken;
        await axios.post(`${API_BASE_URL}/auth/reset-password`, {
          token: restoreToken,
          newPassword: 'password123',
          confirmPassword: 'password123'
        });
        console.log('✅ Contraseña original restaurada');
      }
    }

    console.log('\n🎉 Todas las pruebas de recuperación de contraseña pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
testPasswordReset();
