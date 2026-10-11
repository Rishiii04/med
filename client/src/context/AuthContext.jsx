import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAuthTokens, clearAuthTokens, getStoredUser, setStoredUser } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUser(userData);
      setStoredUser(userData);
      return userData;
    } catch (error) {
      clearAuthTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredUser();
      const token = localStorage.getItem('access_token');
      
      if (token && storedUser) {
        setUser(storedUser);
        try {
          await fetchUser();
        } catch {
          // Token might be expired, will be handled by interceptor
        }
      }
      setInitialized(true);
      setLoading(false);
    };
    
    initAuth();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, access_token, refresh_token } = response.data.data;
    setAuthTokens(access_token, refresh_token);
    setUser(userData);
    setStoredUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { user: newUser, access_token, refresh_token } = response.data.data;
    setAuthTokens(access_token, refresh_token);
    setUser(newUser);
    setStoredUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
    return response.data;
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    changePassword,
    fetchUser,
    isAuthenticated: !!user,
    isPatient: user?.role === 'PATIENT',
    isDoctor: user?.role === 'DOCTOR',
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;