import { db } from '../storage/db';
import type { AdminUser, AdminRole } from '../types';

export const adminService = {
  getAll(): AdminUser[] {
    return db.getAdminUsers();
  },

  getById(id: string): AdminUser | undefined {
    return db.getAdminUsers().find((u) => u.id === id);
  },

  create(user: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>, currentAdmin: AdminUser): AdminUser {
    const users = db.getAdminUsers();
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    db.saveAdminUsers([...users, newUser]);

    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Cadastro de usuário administrativo',
      module: 'Usuários Administrativos',
      entityId: newUser.id,
      details: `Novo usuário ${newUser.name} com perfil ${newUser.role.toUpperCase()}`,
      currentValue: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role }),
    });

    return newUser;
  },

  update(id: string, updates: Partial<AdminUser>, currentAdmin: AdminUser): AdminUser | undefined {
    const users = db.getAdminUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return undefined;

    const previous = { ...target };
    const updated = { ...target, ...updates };
    db.saveAdminUsers(users.map((u) => (u.id === id ? updated : u)));

    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: currentAdmin.role,
      action: 'Atualização de usuário administrativo',
      module: 'Usuários Administrativos',
      entityId: id,
      details: `Alterado perfil/dados de ${updated.name}`,
      previousValue: JSON.stringify({ name: previous.name, role: previous.role, status: previous.status }),
      currentValue: JSON.stringify({ name: updated.name, role: updated.role, status: updated.status }),
    });

    return updated;
  },

  toggleStatus(id: string, currentAdmin: AdminUser): AdminUser | undefined {
    const user = this.getById(id);
    if (!user) return undefined;
    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
    return this.update(id, { status: newStatus }, currentAdmin);
  },

  getRoles(): { role: AdminRole; label: string; desc: string }[] {
    return [
      { role: 'superadmin', label: 'Superadministrador', desc: 'Acesso irrestrito a configurações globais, gestão de usuários internos e todas as operações.' },
      { role: 'admin', label: 'Administrador', desc: 'Gestão completa de estabelecimentos, clientes, pedidos, categorias, produtos e relatórios.' },
      { role: 'operator', label: 'Operador', desc: 'Acompanhamento e intervenção em pedidos ao vivo, estabelecimentos e moderação básica.' },
      { role: 'financial', label: 'Financeiro', desc: 'Gestão de comissões, faturamento, conciliação e repasses a restaurantes.' },
    ];
  },
};
