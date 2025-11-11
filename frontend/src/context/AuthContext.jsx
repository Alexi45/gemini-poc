import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, tokenUtils } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenUtils.getToken();
        const userData = tokenUtils.getUserData();

        if (token && userData) {
          // Verificar que el token siga siendo válido
          const response = await authAPI.verifyToken();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpiar datos locales
            tokenUtils.removeToken();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        tokenUtils.removeToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Función de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        const { user: userData, token } = response.data;
        
        // Guardar datos en localStorage
        tokenUtils.setToken(token);
        tokenUtils.setUserData(userData);
        
        // Actualizar estado
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { user: newUser, token } = response.data;
        
        // Guardar datos en localStorage
        tokenUtils.setToken(token);
        tokenUtils.setUserData(newUser);
        
        // Actualizar estado
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado
      tokenUtils.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Función para actualizar perfil de usuario
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    tokenUtils.setUserData(updatedUserData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
