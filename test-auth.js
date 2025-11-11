// Test simple de registro y login
const api = 'http://localhost:4000/api';

// Función para probar el registro
async function testRegister() {  try {
    const response = await fetch(`${api}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'nuevo@test.com',
        password: 'MiPassword123!',
        confirmPassword: 'MiPassword123!'
      })
    });

    const result = await response.json();
    console.log('Registro:', result);
    return result;
  } catch (error) {
    console.error('Error en registro:', error);
  }
}

// Función para probar el login
async function testLogin() {
  try {
    const response = await fetch(`${api}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'nuevo@test.com',
        password: 'MiPassword123!'
      })
    });

    const result = await response.json();
    console.log('Login:', result);
    return result;
  } catch (error) {
    console.error('Error en login:', error);
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de autenticación...');
  
  // Probar registro
  console.log('\n1️⃣ Probando registro...');
  const registerResult = await testRegister();
  
  if (registerResult && registerResult.success) {
    console.log('✅ Registro exitoso');
    
    // Probar login
    console.log('\n2️⃣ Probando login...');
    const loginResult = await testLogin();
    
    if (loginResult && loginResult.success) {
      console.log('✅ Login exitoso');
      console.log('🎉 Todas las pruebas pasaron!');
    } else {
      console.log('❌ Login falló');
    }
  } else {
    console.log('❌ Registro falló');
  }
}

// Ejecutar las pruebas
runTests();
