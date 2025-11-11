const { getUserInstance } = require('../models/User');
const { getAuthServiceInstance } = require('../services/AuthService');

const authController = {
  // Registro de usuario
  async register(req, res) {
    try {
      const { email, password, confirmPassword } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      const userModel = getUserInstance();

      // Validar formato del email
      if (!userModel.validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del email no es válido'
        });
      }

      // Validar contraseña
      if (!userModel.validatePassword(password)) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, una letra y un número'
        });
      }

      // Validar confirmación de contraseña
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }      // Verificar si el email ya está en uso
      if (await userModel.exists(email)) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este email'
        });
      }

      // Crear usuario
      const newUser = await userModel.create(email, password);
      const authService = getAuthServiceInstance();

      // Generar token JWT
      const token = authService.generateToken(newUser.id, newUser.email);
      
      // Guardar sesión
      await authService.saveSession(newUser.id, token);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            created_at: newUser.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Login de usuario
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

      const userModel = getUserInstance();
      const authService = getAuthServiceInstance();

      // Autenticar usuario
      const user = await userModel.authenticate(email, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }      // Generar token JWT
      const token = authService.generateToken(user.id, user.email);
      
      // Guardar sesión
      await authService.saveSession(user.id, token);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            last_login: user.last_login
          },
          token
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }      const authService = getAuthServiceInstance();
      await authService.invalidateSession(token);

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Solicitar recuperación de contraseña
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El email es obligatorio'
        });
      }

      const userModel = getUserInstance();
      const authService = getAuthServiceInstance();      // Verificar que el usuario existe
      const user = await userModel.findByEmail(email);
      if (!user) {
        // No revelar si el email existe o no por seguridad
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás un enlace de recuperación'
        });
      }

      // Generar token de recuperación
      const resetToken = await authService.generatePasswordResetToken(user.id);

      // TODO: Enviar email con el token
      // Por ahora solo lo logueamos para desarrollo
      console.log(`🔑 Token de recuperación para ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
        // Solo para desarrollo - remover en producción
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      console.error('Error en forgot password:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Restablecer contraseña
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token y nueva contraseña son obligatorios'
        });
      }

      const userModel = getUserInstance();
      const authService = getAuthServiceInstance();      // Verificar token
      const tokenVerification = await authService.verifyPasswordResetToken(token);
      if (!tokenVerification.valid) {
        return res.status(400).json({
          success: false,
          message: tokenVerification.reason
        });
      }

      // Validar nueva contraseña
      if (!userModel.validatePassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, una letra y un número'
        });
      }

      // Actualizar contraseña
      await userModel.updatePassword(tokenVerification.userId, newPassword);
      
      // Marcar token como usado
      await authService.markPasswordResetTokenAsUsed(token);
      
      // Invalidar todas las sesiones del usuario
      await authService.invalidateAllUserSessions(tokenVerification.userId);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error en reset password:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Verificar token
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const authService = getAuthServiceInstance();
      
      // Verificar JWT
      const decoded = authService.verifyToken(token);
        // Verificar sesión en base de datos
      const sessionInfo = await authService.getSessionInfo(token);
      if (!sessionInfo) {
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: sessionInfo.user_id,
            email: sessionInfo.email
          }
        }
      });
    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }
};

module.exports = authController;
