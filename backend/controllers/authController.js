const User = require('../models/User');
const AuthService = require('../services/AuthService');

const authController = {
  // Registro de usuario
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, confirmPassword } = req.body;

      // Validar campos requeridos
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios'
        });
      }

      // Validar formato del email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del email no es válido'
        });
      }

      // Validar longitud de la contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Validar confirmación de contraseña
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      // Verificar si el usuario ya existe
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este email'
        });
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este nombre de usuario'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await User.hashPassword(password);

      // Crear usuario
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName
      });

      // Generar token JWT
      const token = AuthService.generateToken(newUser.id, newUser.username);
      
      // Guardar sesión
      await AuthService.saveSession(newUser.id, token);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          },
          token
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el registro'
      });
    }
  },

  // Inicio de sesión
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Validar contraseña
      const isValidPassword = await User.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Actualizar último login
      await User.updateLastLogin(user.id);

      // Generar token JWT
      const token = AuthService.generateToken(user.id, user.username);
      
      // Guardar sesión
      await AuthService.saveSession(user.id, token);

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            lastLogin: user.lastLogin
          },
          token
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el login'
      });
    }
  },

  // Cerrar sesión
  async logout(req, res) {
    try {
      const token = req.token;
      
      if (token) {
        await AuthService.invalidateSession(token);
      }

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el logout'
      });
    }
  },

  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el perfil'
      });
    }
  },

  // Verificar token
  async verifyToken(req, res) {
    try {
      const user = req.user;
      
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user
        }
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar el token'
      });
    }
  }
};

module.exports = authController;
