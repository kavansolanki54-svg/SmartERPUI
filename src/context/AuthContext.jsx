import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State (e.g. check local memory, attempt silent refresh if refresh token is in HttpOnly cookie)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Perform a silent refresh to get a fresh Access Token on startup/refresh
          const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7290';
          const res = await axios.post(`${API_URL}/api/Auth/refresh-token`, {}, { withCredentials: true });
          if (res.data && res.data.success) {
            setToken(res.data.data.accessToken);
            setUser(res.data.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
          } else {
            handleLogoutCleanState();
          }
        } catch (error) {
          console.error("Silent refresh failed during init", error);
          handleLogoutCleanState();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogoutCleanState = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  const login = (userData, accessToken) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7290';
      await axios.post(`${API_URL}/api/Auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout API call failed", e);
    } finally {
      handleLogoutCleanState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, login, logout, loading, handleLogoutCleanState }}>
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
