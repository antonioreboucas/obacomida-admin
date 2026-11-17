import { db } from '../storage/db';
import type { AdminUser, AdminRole } from '../types';

export const authService = {
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

  login(email: string, _password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = db.getAdminUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!found) {
          resolve({ success: false, error: 'E-mail ou senha incorretos' });
          return;
        }

        if (found.status === 'Inativo') {
          resolve({ success: false, error: 'Usuário administrativo inativo ou suspenso' });
          return;
        }

        // Update lastLogin
        const updatedUser = { ...found, lastLogin: new Date().toISOString() };
        db.saveAdminUsers(users.map((u) => (u.id === found.id ? updatedUser : u)));
        db.setActiveUser(updatedUser);

        db.logAudit({
          adminId: updatedUser.id,
          adminName: updatedUser.name,
          adminRole: updatedUser.role,
          action: 'Login administrativo efetuado',
          module: 'Autenticação',
          entityId: updatedUser.id,
          details: `Acesso autenticado para ${updatedUser.email}`,
        });

        resolve({ success: true, user: updatedUser });
      }, 350);
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
