import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, profileApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      try {
        const prof = await profileApi.getProfile();
        setProfile(prof);
      } catch (err) {
        setProfile(null);
      }
    } catch (error) {
      console.error('Auth verification failed', error);
      localStorage.removeItem('ironlog_token');
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('ironlog_token');
      if (token) {
        await fetchUserData();
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('ironlog_token', data.access_token);
      await fetchUserData();
      return { success: true };
    } catch (error) {
      const detail = error.response?.data?.detail || 'Invalid email or password';
      return { success: false, error: detail };
    }
  };

  const register = async (email, password) => {
    try {
      await authApi.register(email, password);
      return await login(email, password);
    } catch (error) {
      const detail = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: detail };
    }
  };

  const logout = () => {
    localStorage.removeItem('ironlog_token');
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    try {
      const prof = await profileApi.getProfile();
      setProfile(prof);
      return prof;
    } catch (err) {
      console.error('Error refreshing profile', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
