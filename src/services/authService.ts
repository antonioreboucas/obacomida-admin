import { db } from '../storage/db';
import type { AdminUser, AdminRole } from '../types';

const SESSION_KEY = 'obacomida_auth_session';

export const authService = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY));
  },

  getCurrentUser(): AdminUser {
    return db.getActiveUser();
  },

  setCurrentUser(user: AdminUser): void {
    db.setActiveUser(user);
    db.logAudit({
      adminId: user.id,
      adminName: user.name,
      adminRole: user.role,
      action: 'Simulação de troca de usuário/perfil',
      module: 'Autenticação',
      entityId: user.id,
      details: `Perfil alternado para ${user.name} (${user.role.toUpperCase()})`,
    });
  },

  login(
    email: string,
    password?: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const users = db.getAdminUsers();
        const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!found) {
          resolve({
            success: false,
            error: 'E-mail administrativo não encontrado na base corporativa.',
          });
          return;
        }

        if (found.status === 'Inativo') {
          resolve({
            success: false,
            error: 'Acesso bloqueado: este usuário administrativo está inativo ou suspenso.',
          });
          return;
        }

        // Demo password validation: minimum 4 chars, default demo is 'admin123'
        if (password !== undefined && password.trim().length > 0 && password.trim().length < 4) {
          resolve({
            success: false,
            error: 'Senha inválida. Digite ao menos 4 caracteres (padrão de demonstração: admin123).',
          });
          return;
        }

        // Update lastLogin
        const updatedUser = { ...found, lastLogin: new Date().toISOString() };
        db.saveAdminUsers(users.map((u) => (u.id === found.id ? updatedUser : u)));
        db.setActiveUser(updatedUser);

        // Store session
        const sessionData = JSON.stringify({
          userId: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          name: updatedUser.name,
          loginTime: new Date().toISOString(),
        });

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem(SESSION_KEY, sessionData);
          } else {
            sessionStorage.setItem(SESSION_KEY, sessionData);
          }
        }

        db.logAudit({
          adminId: updatedUser.id,
          adminName: updatedUser.name,
          adminRole: updatedUser.role,
          action: 'Login administrativo efetuado',
          module: 'Autenticação',
          entityId: updatedUser.id,
          details: `Acesso autenticado com sucesso para ${updatedUser.email} (${updatedUser.role.toUpperCase()})`,
        });

        resolve({ success: true, user: updatedUser });
      }, 350);
    });
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }
    const current = db.getActiveUser();
    db.logAudit({
      adminId: current.id,
      adminName: current.name,
      adminRole: current.role,
      action: 'Logout administrativo efetuado',
      module: 'Autenticação',
      entityId: current.id,
      details: `Sessão encerrada para ${current.email}`,
    });
  },

  recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Instruções de redefinição de senha enviadas com sucesso para ${email}.`,
        });
      }, 400);
    });
  },

  hasPermission(role: AdminRole, requiredPermission: 'manage_users' | 'manage_settings' | 'manage_restaurants' | 'manage_orders' | 'manage_financial' | 'view_reports' | 'moderate'): boolean {
    switch (role) {
      case 'superadmin':
        return true;
      case 'admin':
        return requiredPermission !== 'manage_users' && requiredPermission !== 'manage_settings';
      case 'financial':
        return requiredPermission === 'manage_financial' || requiredPermission === 'view_reports';
      case 'operator':
        return requiredPermission === 'manage_orders' || requiredPermission === 'moderate' || requiredPermission === 'view_reports';
      default:
        return false;
    }
  },
};
