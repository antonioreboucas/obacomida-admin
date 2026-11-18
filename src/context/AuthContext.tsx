import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminUser, AdminRole } from '../types';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { api, isMockEnabled } from '../services/api';
import { db } from '../storage/db';

interface AuthContextType {
  currentUser: AdminUser;
  isLoggedIn: boolean;
  isApiConnected: boolean;
  apiBaseUrl: string;
  checkApiConnection: () => Promise<boolean>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void | Promise<void>;
  switchUser: (userId: string) => void;
  switchRole: (role: AdminRole) => void;
  hasPermission: (
    permission:
      | 'manage_users'
      | 'manage_settings'
      | 'manage_restaurants'
      | 'manage_orders'
      | 'manage_financial'
      | 'view_reports'
      | 'moderate'
  ) => boolean;
  availableStaff: AdminUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser>(authService.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (isMockEnabled()) return true;
    return !!api.getToken();
  });
  const [availableStaff, setAvailableStaff] = useState<AdminUser[]>(adminService.getAll());
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(api.getBaseUrl());

  const checkApiConnection = useCallback(async (): Promise<boolean> => {
    const res = await api.checkHealth();
    setIsApiConnected(res.connected);
    setApiBaseUrl(res.url);
    return res.connected;
  }, []);

  useEffect(() => {
    // Check initial API health
    checkApiConnection();

    // Try auto-login if token is present
    const initSession = async () => {
      const token = api.getToken();
      if (token) {
        const user = await authService.getMe();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } else if (!isMockEnabled()) {
        setIsLoggedIn(false);
      }
    };
    initSession();

    // Subscribe to API status changes
    const unsubStatus = api.onStatusChange((connected, url) => {
      setIsApiConnected(connected);
      setApiBaseUrl(url);
    });

    // Handle 401 unauthorized
    api.onUnauthorized(() => {
      setIsLoggedIn(false);
    });

    // Subscribe to DB changes
    const unsubDb = db.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
      setAvailableStaff(adminService.getAll());
    });

    return () => {
      unsubStatus();
      unsubDb();
    };
  }, [checkApiConnection]);

  const login = useCallback(async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsLoggedIn(true);
      if (res.isApiConnected !== undefined) {
        setIsApiConnected(res.isApiConnected);
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha no login' };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsLoggedIn(false);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = adminService.getById(userId);
    if (user) {
      authService.setCurrentUser(user);
      setCurrentUser(user);
    }
  }, []);

  const switchRole = useCallback((role: AdminRole) => {
    const staff = adminService.getAll();
    const target = staff.find((u) => u.role === role && u.status === 'Ativo') || staff[0];
    if (target) {
      authService.setCurrentUser(target);
      setCurrentUser(target);
    }
  }, []);

  const hasPermission = useCallback(
    (
      perm:
        | 'manage_users'
        | 'manage_settings'
        | 'manage_restaurants'
        | 'manage_orders'
        | 'manage_financial'
        | 'view_reports'
        | 'moderate'
    ) => {
      return authService.hasPermission(currentUser.role, perm);
    },
    [currentUser.role]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isApiConnected,
        apiBaseUrl,
        checkApiConnection,
        login,
        logout,
        switchUser,
        switchRole,
        hasPermission,
        availableStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
