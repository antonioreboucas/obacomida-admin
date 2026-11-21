import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { AdminUser, AdminRole } from '../types';

export interface AdminUserCreatePayload {
  name: string;        // Mínimo 2 caracteres
  email: string;       // Formato de e-mail válido
  password: string;    // Mínimo 6 caracteres
  phone?: string;      // Opcional
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'FINANCIAL';
  is_active?: boolean; // Padrão: true
}

export const adminService = {
  /**
   * GET /api/v1/admin/users?role=&search=&page=&per_page=
   * Lista usuários da plataforma com paginação e filtros
   */
  async fetchUsers(
    search = '',
    role = '',
    page = 1,
    pageSize = 20
  ): Promise<{ items: AdminUser[]; total: number }> {
    try {
      const params: Record<string, any> = { page, page_size: pageSize, per_page: pageSize };
      if (search) params.search = search;
      if (role && role !== 'all') params.role = role.toUpperCase();

      const data = await api.get<any>('/admin/users', params);

      if (Array.isArray(data)) {
        return {
          items: data.map((item) => this.normalizeFromApi(item)),
          total: data.length,
        };
      } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: any) => this.normalizeFromApi(item)),
          total: data.total || data.count || data.items.length,
        };
      }
    } catch (err) {
      console.warn('API de usuários inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return { items: [], total: 0 };
    }

    const localUsers = this.getAll();
    const filtered = localUsers.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        !role ||
        role === 'all' ||
        String(u.role).toUpperCase() === role.toUpperCase();
      return matchSearch && matchRole;
    });

    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    };
  },

  /**
   * GET /api/v1/admin/users/{id}
   */
  async fetchUserById(id: string): Promise<AdminUser | undefined> {
    try {
      const data = await api.get<any>(`/admin/users/${id}`);
      if (data && data.id) {
        return this.normalizeFromApi(data);
      }
      if (!isMockEnabled()) {
        return undefined;
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn(`Erro ao carregar usuário ${id} da API central:`, err);
        return undefined;
      }
    }
    return this.getById(id);
  },

  /**
   * POST /api/v1/admin/users/{id}/roles
   * Payload: { role_name: "ADMIN" | "PARTNER" | "CUSTOMER" | "SUPER_ADMIN" }
   */
  async assignRole(
    userId: string,
    roleName: string,
    currentAdmin: AdminUser
  ): Promise<AdminUser | undefined> {
    try {
      await api.post(`/admin/users/${userId}/roles`, {
        role_name: roleName.toUpperCase(),
      });
    } catch (err) {
      console.warn('Erro ao atribuir role via API, aplicando fallback local:', err);
    }

    const role = roleName.toUpperCase() as AdminRole;
    return this.update(userId, { role, roles: [roleName] }, currentAdmin);
  },

  /**
   * DELETE /api/v1/admin/users/{id}/roles/{role_name}
   * Revoga perfil de acesso do usuário
   */
  async revokeRole(
    userId: string,
    roleName: string,
    currentAdmin: AdminUser
  ): Promise<AdminUser | undefined> {
    try {
      await api.delete(`/admin/users/${userId}/roles/${roleName.toUpperCase()}`);
    } catch (err) {
      console.warn('Erro ao revogar role via API, aplicando fallback local:', err);
    }

    const user = this.getById(userId);
    if (!user) return undefined;
    const remainingRoles = (user.roles || []).filter((r) => r.toUpperCase() !== roleName.toUpperCase());
    const nextRole = remainingRoles[0] ? (remainingRoles[0] as AdminRole) : 'admin';
    return this.update(userId, { role: nextRole, roles: remainingRoles }, currentAdmin);
  },

  /**
   * POST /api/v1/admin/users/{id}/block
   */
  async blockUser(userId: string, currentAdmin: AdminUser): Promise<AdminUser | undefined> {
    try {
      await api.post(`/admin/users/${userId}/block`);
    } catch (err) {
      console.warn('Erro ao bloquear usuário via API, aplicando fallback local:', err);
    }

    return this.update(userId, { status: 'Inativo', is_blocked: true, is_active: false }, currentAdmin);
  },

  /**
   * POST /api/v1/admin/users/{id}/unblock
   */
  async unblockUser(userId: string, currentAdmin: AdminUser): Promise<AdminUser | undefined> {
    try {
      await api.post(`/admin/users/${userId}/unblock`);
    } catch (err) {
      console.warn('Erro ao desbloquear usuário via API, aplicando fallback local:', err);
    }

    return this.update(userId, { status: 'Ativo', is_blocked: false, is_active: true }, currentAdmin);
  },

  /**
   * PATCH /api/v1/admin/users/{id}/status
   * Payload: { is_active: boolean }
   */
  async updateUserStatus(
    userId: string,
    isActive: boolean,
    currentAdmin: AdminUser
  ): Promise<AdminUser | undefined> {
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        is_active: isActive,
      });
    } catch (err) {
      console.warn('Erro ao atualizar status via PATCH /admin/users/{id}/status, aplicando fallback:', err);
      try {
        if (!isActive) {
          await api.post(`/admin/users/${userId}/block`);
        } else {
          await api.post(`/admin/users/${userId}/unblock`);
        }
      } catch {
        // Fallback local
      }
    }

    return this.update(
      userId,
      {
        status: isActive ? 'Ativo' : 'Inativo',
        is_active: isActive,
        is_blocked: !isActive,
      },
      currentAdmin
    );
  },

  /**
   * POST /api/v1/admin/users
   * Cadastra novo usuário administrativo com validações de RBAC
   */
  async createAdminUser(
    payload: AdminUserCreatePayload,
    currentAdmin: AdminUser
  ): Promise<AdminUser> {
    try {
      const data = await api.post<any>('/admin/users', {
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
        phone: payload.phone?.trim() || undefined,
        role: payload.role,
        is_active: payload.is_active ?? true,
      });

      if (data && (data.id || data.user_id)) {
        const created = this.normalizeFromApi(data);
        db.saveAdminUsers([...db.getAdminUsers(), created]);
        db.logAudit({
          adminId: currentAdmin.id,
          adminName: currentAdmin.name,
          adminRole: String(currentAdmin.role),
          action: 'Cadastro de usuário administrativo via API central',
          module: 'Usuários Administrativos',
          entityId: created.id,
          details: `Novo usuário ${created.name} (${created.email}) cadastrado com perfil ${created.role}`,
          currentValue: JSON.stringify({ name: created.name, email: created.email, role: created.role }),
        });
        return created;
      }
    } catch (err: any) {
      console.warn('Erro ao cadastrar usuário via API POST /admin/users, usando fallback:', err);
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }
    }

    const fallbackUser: AdminUser = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || '(11) 98888-0000',
      role: payload.role as AdminRole,
      roles: [payload.role],
      status: payload.is_active === false ? 'Inativo' : 'Ativo',
      is_active: payload.is_active ?? true,
      is_blocked: payload.is_active === false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      department:
        payload.role === 'SUPER_ADMIN'
          ? 'Diretoria Executiva'
          : payload.role === 'FINANCIAL'
          ? 'Financeiro'
          : payload.role === 'OPERATOR'
          ? 'Operações & Atendimento'
          : 'Administração Geral',
    };

    db.saveAdminUsers([...db.getAdminUsers(), fallbackUser]);
    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: String(currentAdmin.role),
      action: 'Cadastro de usuário administrativo',
      module: 'Usuários Administrativos',
      entityId: fallbackUser.id,
      details: `Novo usuário ${fallbackUser.name} cadastrado com perfil ${fallbackUser.role}`,
      currentValue: JSON.stringify({ name: fallbackUser.name, email: fallbackUser.email, role: fallbackUser.role }),
    });

    return fallbackUser;
  },

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
      adminRole: String(currentAdmin.role),
      action: 'Cadastro de usuário da plataforma',
      module: 'Usuários Administrativos',
      entityId: newUser.id,
      details: `Novo usuário ${newUser.name} com perfil ${String(newUser.role).toUpperCase()}`,
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
      adminRole: String(currentAdmin.role),
      action: 'Atualização de usuário / concessão de role',
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
    const isCurrentlyActive = user.status === 'Ativo' && !user.is_blocked;
    if (isCurrentlyActive) {
      return this.blockUser(id, currentAdmin) as any;
    } else {
      return this.unblockUser(id, currentAdmin) as any;
    }
  },

  getRoles(): { role: AdminRole; label: string; desc: string }[] {
    return [
      { role: 'SUPER_ADMIN', label: 'Superadministrador (SUPER_ADMIN)', desc: 'Acesso irrestrito a configurações globais, gestão de usuários internos e todas as operações.' },
      { role: 'ADMIN', label: 'Administrador (ADMIN)', desc: 'Gestão completa de estabelecimentos, clientes, pedidos, categorias, produtos e relatórios.' },
      { role: 'PARTNER', label: 'Parceiro / Restaurante (PARTNER)', desc: 'Acesso restrito ao cardápio, pedidos e configurações da sua própria loja.' },
      { role: 'CUSTOMER', label: 'Consumidor (CUSTOMER)', desc: 'Acesso exclusivo para realizar pedidos e avaliar estabelecimentos pelo aplicativo.' },
      { role: 'operator', label: 'Operador de Atendimento', desc: 'Acompanhamento e intervenção em pedidos ao vivo, suporte e moderação.' },
      { role: 'financial', label: 'Financeiro', desc: 'Gestão de comissões, faturamento, conciliação e repasses a restaurantes.' },
    ];
  },

  normalizeFromApi(item: any): AdminUser {
    const rawRole = item.role || (item.roles && item.roles[0]) || 'CUSTOMER';
    const upper = String(rawRole).toUpperCase();
    const isBlocked = item.is_blocked ?? (item.status === 'Inativo' || item.status === 'BLOCKED');

    return {
      id: String(item.id || item.user_id),
      name: item.name || item.full_name || item.username || 'Usuário',
      email: item.email || '',
      role: (upper as AdminRole) || 'CUSTOMER',
      roles: item.roles || [rawRole],
      status: isBlocked ? 'Inativo' : 'Ativo',
      is_active: item.is_active ?? !isBlocked,
      is_blocked: isBlocked,
      avatar: item.avatar || item.avatar_url,
      phone: item.phone || '(11) 98888-0000',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      lastLogin: item.last_login || item.lastLogin || new Date().toISOString(),
      department: item.department || (upper.includes('ADMIN') ? 'Administração' : 'Plataforma'),
    };
  },
};
