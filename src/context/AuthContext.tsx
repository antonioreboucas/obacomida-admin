import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminUser, AdminRole } from '../types';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { db } from '../storage/db';

interface AuthContextType {
  currentUser: AdminUser;
  isLoggedIn: boolean;
  login: (email: string, pass?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: AdminRole) => void;
  hasPermission: (permission: 'manage_users' | 'manage_settings' | 'manage_restaurants' | 'manage_orders' | 'manage_financial' | 'view_reports' | 'moderate') => boolean;
  availableStaff: AdminUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser>(authService.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => authService.isAuthenticated());
  const [availableStaff, setAvailableStaff] = useState<AdminUser[]>(adminService.getAll());

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
      setAvailableStaff(adminService.getAll());
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, pass?: string, rememberMe: boolean = true) => {
    const res = await authService.login(email, pass, rememberMe);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsLoggedIn(true);
      return { success: true };
    }
    return { success: false, error: res.error || 'Falha no login' };
  }, []);

  const logout = useCallback(() => {
    authService.logout();
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

  const hasPermission = useCallback((perm: 'manage_users' | 'manage_settings' | 'manage_restaurants' | 'manage_orders' | 'manage_financial' | 'view_reports' | 'moderate') => {
    return authService.hasPermission(currentUser.role, perm);
  }, [currentUser.role]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
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
