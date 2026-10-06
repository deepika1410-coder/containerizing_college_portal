import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('campusflow_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then(res => {
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      if (res.token && res.user) {
        localStorage.setItem('campusflow_token', res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const loginWithDemo = async (role) => {
    let email = 'student@campusflow.edu';
    if (role === 'FACULTY') email = 'faculty@campusflow.edu';
    if (role === 'ADMIN') email = 'admin@campusflow.edu';
    return login(email, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('campusflow_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.user) setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithDemo, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
