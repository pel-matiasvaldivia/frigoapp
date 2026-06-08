import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, permisosAPI } from '../services/api';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'SUPERADMIN' | 'ADMINISTRATIVO' | 'VENDEDOR' | 'REPARTIDOR' | 'CLIENTE';
  activo: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermissions = async () => {
    try {
      const perms = await permisosAPI.getMyPermissions();
      setPermissions(perms);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setPermissions([]);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await authAPI.getMe();
          setUser(profile);
          await fetchPermissions();
        } catch (error) {
          console.error("Error booting authentication:", error);
          localStorage.removeItem('token');
          setUser(null);
          setPermissions([]);
        }
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('token', data.access_token);
      
      const profile = await authAPI.getMe();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      
      // Load permissions right after login
      await fetchPermissions();
    } catch (error) {
      setUser(null);
      setPermissions([]);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  const hasPermission = (modulo: string): boolean => {
    if (!user) return false;
    if (user.rol === 'SUPERADMIN') return true;
    return permissions.includes(modulo);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasRole, hasPermission, isAuthenticated }}>
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
