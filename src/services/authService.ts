import { api, ApiError, isMockEnabled } from './api';
import { db } from '../storage/db';
import type { AdminUser, AdminRole } from '../types';
import type { ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../types/api';

export interface AuthLoginResponse {
  success: boolean;
  user?: AdminUser;
  error?: string;
  isApiConnected?: boolean;
}

const SESSION_KEY = 'obacomida_auth_session';

export const authService = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(api.getToken() || localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY));
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
      details: `Perfil alternado para ${user.name} (${String(user.role).toUpperCase()})`,
    });
  },

  /**
   * GET /api/v1/auth/me
   * Retorna os dados do usuário autenticado e valida permissões ADMIN / SUPER_ADMIN
   */
  async getMe(): Promise<AdminUser | null> {
    const token = api.getToken();
    if (!token) return null;

    try {
      const rawData = await api.get<any>('/auth/me');
      const data =
        rawData && rawData.data !== undefined && rawData.success !== undefined
          ? rawData.data
          : rawData;
      if (!data) return null;

      let roles: string[] = Array.isArray(data.roles) ? [...data.roles] : [];
      if (data.role && !roles.includes(data.role)) {
        roles.unshift(data.role);
      }

      // Seed admin accounts support (admin1 & superadmin)
      const lowerEmail = (data.email || '').toLowerCase();
      if (lowerEmail === 'admin1@obacomida.com.br') {
        if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
          roles.unshift('ADMIN');
        }
      } else if (lowerEmail === 'superadmin@obacomida.com.br') {
        if (!roles.includes('SUPER_ADMIN')) {
          roles.unshift('SUPER_ADMIN');
        }
      }

      const primaryRole = roles[0] || '';
      const normalizedRole = this.normalizeRole(primaryRole);
      const isAllowed =
        normalizedRole === 'SUPER_ADMIN' ||
        normalizedRole === 'ADMIN' ||
        normalizedRole === 'superadmin' ||
        normalizedRole === 'admin';

      if (!isAllowed) {
        api.clearToken();
        return null;
      }

      const user: AdminUser = {
        id: data.id || data.user_id || `usr-${Date.now()}`,
        name:
          data.name ||
          data.full_name ||
          data.username ||
          (lowerEmail.includes('super') ? 'Super Administrador' : 'Administrador'),
        email: data.email || lowerEmail,
        role: normalizedRole,
        roles: roles.map((r) => this.normalizeRole(r)),
        status: data.is_active === false || data.is_blocked === true ? 'Inativo' : 'Ativo',
        is_active: data.is_active ?? true,
        is_blocked: data.is_blocked ?? false,
        avatar: data.avatar || data.avatar_url,
        phone: data.phone || '(11) 98888-0000',
        createdAt: data.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        department:
          data.department ||
          (normalizedRole === 'SUPER_ADMIN' ? 'Diretoria / Superadmin' : 'Administração Central'),
      };

      db.setActiveUser(user);
      return user;
    } catch {
      return null;
    }
  },

  /**
   * POST /api/v1/auth/login
   * Body: { email, password }
   */
  async login(
    email: string,
    password?: string,
    rememberMe: boolean = true
  ): Promise<AuthLoginResponse> {
    const cleanEmail = email.trim();
    const cleanPassword = password || '';

    try {
      // Step 1: Attempt login via FastAPI backend POST /api/v1/auth/login
      let rawTokenData: any = null;

      // Try JSON payload first ({ email, password })
      try {
        rawTokenData = await api.post<any>('/auth/login', {
          email: cleanEmail,
          username: cleanEmail,
          password: cleanPassword,
        });
      } catch (jsonErr: any) {
        // Fallback to OAuth2 form-urlencoded if 422 or 415 returned
        if (jsonErr.status === 422 || jsonErr.status === 415) {
          const params = new URLSearchParams();
          params.append('username', cleanEmail);
          params.append('password', cleanPassword);

          rawTokenData = await api.request<any>('/auth/login', {
            method: 'POST',
            data: params.toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
        } else {
          throw jsonErr;
        }
      }

      const tokenData =
        rawTokenData && rawTokenData.data !== undefined && rawTokenData.success !== undefined
          ? rawTokenData.data
          : rawTokenData;

      const accessToken = tokenData?.access_token || tokenData?.token;
      if (!accessToken) {
        throw new Error('A resposta da API não conteve o token de acesso (access_token).');
      }

      // Store tokens
      api.setToken(accessToken);
      const refreshToken = tokenData?.refresh_token || rawTokenData?.refresh_token;
      if (refreshToken) {
        api.setRefreshToken(refreshToken);
      }

      // Step 2: Fetch and validate user role from /api/v1/auth/me
      const rawUserData = await api.get<any>('/auth/me');
      const userData =
        rawUserData && rawUserData.data !== undefined && rawUserData.success !== undefined
          ? rawUserData.data
          : rawUserData;

      let roles: string[] = Array.isArray(userData?.roles) ? [...userData.roles] : [];
      if (userData?.role && !roles.includes(userData.role)) {
        roles.unshift(userData.role);
      }

      // Seed admin credentials support
      const lowerEmail = cleanEmail.toLowerCase();
      if (lowerEmail === 'admin1@obacomida.com.br') {
        if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
          roles.unshift('ADMIN');
        }
      } else if (lowerEmail === 'superadmin@obacomida.com.br') {
        if (!roles.includes('SUPER_ADMIN')) {
          roles.unshift('SUPER_ADMIN');
        }
      }

      const primaryRole = roles[0] || '';
      const normalizedRole = this.normalizeRole(primaryRole);

      // Enforce RBAC requirement: ADMIN or SUPER_ADMIN only
      const isAuthorized =
        normalizedRole === 'SUPER_ADMIN' ||
        normalizedRole === 'ADMIN' ||
        normalizedRole === 'superadmin' ||
        normalizedRole === 'admin';

      if (!isAuthorized) {
        api.clearToken();
        return {
          success: false,
          error: `Acesso negado: Usuário com perfil "${primaryRole || 'SEM PERFIL'}" não possui permissão para acessar o Painel Administrativo. Apenas ADMIN e SUPER_ADMIN são autorizados.`,
        };
      }

      const adminUser: AdminUser = {
        id: userData?.id || userData?.user_id || `usr-${Date.now()}`,
        name:
          userData?.name ||
          userData?.full_name ||
          userData?.username ||
          (lowerEmail.includes('super') ? 'Super Administrador' : 'Administrador'),
        email: userData?.email || cleanEmail,
        role: normalizedRole,
        roles: roles.map((r) => this.normalizeRole(r)),
        status: userData?.is_active === false || userData?.is_blocked === true ? 'Inativo' : 'Ativo',
        is_active: userData?.is_active ?? true,
        is_blocked: userData?.is_blocked ?? false,
        avatar: userData?.avatar || userData?.avatar_url,
        phone: userData?.phone || '(11) 98888-0000',
        createdAt: userData?.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        department:
          userData?.department ||
          (normalizedRole === 'SUPER_ADMIN' ? 'Diretoria / Superadmin' : 'Operações & Admin'),
      };

      db.setActiveUser(adminUser);

      // Store session
      if (typeof window !== 'undefined') {
        const sessionData = JSON.stringify({
          userId: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          name: adminUser.name,
          loginTime: new Date().toISOString(),
        });
        if (rememberMe) {
          localStorage.setItem(SESSION_KEY, sessionData);
        } else {
          sessionStorage.setItem(SESSION_KEY, sessionData);
        }
      }

      db.logAudit({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminRole: String(adminUser.role),
        action: 'Login administrativo via API central',
        module: 'Autenticação',
        entityId: adminUser.id,
        details: `Login autorizado com role ${normalizedRole} para ${adminUser.email}`,
      });

      return { success: true, user: adminUser, isApiConnected: true };
    } catch (err: any) {
      console.warn('Falha na autenticação via API central:', err);

      const isNetworkError =
        err.status === 0 ||
        err.message?.includes('Falha de conexão') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Network Error');

      if (isNetworkError) {
        if (!isMockEnabled()) {
          return {
            success: false,
            error: `Não foi possível conectar à API central FastAPI (${api.getBaseUrl()}). Certifique-se de que o backend está rodando no endereço configurado.`,
          };
        }

        // Fallback check for offline testing / demo only when isMockEnabled()
        const lowerEmail = cleanEmail.toLowerCase();
        if (
          (lowerEmail === 'admin1@obacomida.com.br' || lowerEmail === 'superadmin@obacomida.com.br') &&
          cleanPassword === 'Admin@123456'
        ) {
          const role: AdminRole = lowerEmail === 'superadmin@obacomida.com.br' ? 'SUPER_ADMIN' : 'ADMIN';
          const mockUser: AdminUser = {
            id: role === 'SUPER_ADMIN' ? 'usr-super-seed' : 'usr-admin-seed',
            name: role === 'SUPER_ADMIN' ? 'Super Administrador (Seed)' : 'Administrador Oficial (Seed)',
            email: cleanEmail,
            role,
            roles: [role],
            status: 'Ativo',
            phone: '(11) 99999-0001',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            department: 'Administração Geral',
          };
          db.setActiveUser(mockUser);
          return { success: true, user: mockUser, isApiConnected: false };
        }

        // Check local DB users
        const localUsers = db.getAdminUsers();
        const found = localUsers.find((u) => u.email.toLowerCase() === lowerEmail);
        if (found) {
          if (found.status === 'Inativo') {
            return { success: false, error: 'Usuário administrativo inativo ou suspenso.' };
          }
          db.setActiveUser(found);
          return { success: true, user: found, isApiConnected: false };
        }

        return {
          success: false,
          error: `Não foi possível conectar ao servidor FastAPI (${api.getBaseUrl()}). Verifique se a API está rodando localmente na porta 8000.`,
        };
      }

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err.message || 'E-mail ou senha incorretos.';

      return { success: false, error: errorMessage };
    }
  },

  /**
   * POST /api/v1/auth/refresh
   * Renova tokens JWT
   */
  async refresh(): Promise<boolean> {
    const refreshToken = api.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await api.post<any>('/auth/refresh', { refresh_token: refreshToken });
      const data = res?.data || res;
      if (data?.access_token) {
        api.setToken(data.access_token);
        if (data.refresh_token) {
          api.setRefreshToken(data.refresh_token);
        }
        return true;
      }
      return false;
    } catch {
      api.clearToken();
      return false;
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }
    const refreshToken = api.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch (err) {
        console.warn('Erro ao revogar sessão via POST /auth/logout:', err);
      }
    }
    api.clearToken();
    const active = db.getActiveUser();
    db.logAudit({
      adminId: active.id,
      adminName: active.name,
      adminRole: String(active.role),
      action: 'Logout efetuado',
      module: 'Autenticação',
      entityId: active.id,
      details: `Logout da sessão de ${active.email}`,
    });
  },

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.post<any>('/auth/change-password', data);
      return {
        success: true,
        message: res?.message || 'Senha alterada com sucesso.',
      };
    } catch (err: any) {
      throw new Error(err.message || 'Falha ao alterar senha.');
    }
  },

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.post<any>('/auth/forgot-password', data);
      return {
        success: true,
        message: res?.message || `Instruções de recuperação enviadas para ${data.email}.`,
      };
    } catch (err: any) {
      return {
        success: true,
        message: `Instruções de recuperação enviadas para ${data.email}.`,
      };
    }
  },

  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.post<any>('/auth/reset-password', data);
      return {
        success: true,
        message: res?.message || 'Senha redefinida com sucesso.',
      };
    } catch (err: any) {
      throw new Error(err.message || 'Falha ao redefinir senha.');
    }
  },

  normalizeRole(role?: string): AdminRole {
    if (!role) return 'admin';
    const upper = String(role).toUpperCase().replace(/-/g, '_');
    if (upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN') return 'SUPER_ADMIN';
    if (upper === 'ADMIN' || upper === 'ADMINISTRADOR') return 'ADMIN';
    if (upper === 'PARTNER') return 'PARTNER';
    if (upper === 'CUSTOMER') return 'CUSTOMER';
    if (role.toLowerCase() === 'operator') return 'operator';
    if (role.toLowerCase() === 'financial') return 'financial';
    return (role.toLowerCase() as AdminRole) || 'admin';
  },

  recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.forgotPassword({ email });
  },

  hasPermission(
    role: AdminRole,
    requiredPermission:
      | 'manage_users'
      | 'manage_settings'
      | 'manage_restaurants'
      | 'manage_orders'
      | 'manage_financial'
      | 'view_reports'
      | 'moderate'
  ): boolean {
    const r = String(role).toUpperCase();
    if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN' || role === 'superadmin') {
      return true;
    }
    if (r === 'ADMIN' || role === 'admin') {
      return true;
    }
    if (r === 'FINANCIAL' || role === 'financial') {
      return requiredPermission === 'manage_financial' || requiredPermission === 'view_reports';
    }
    if (r === 'OPERATOR' || role === 'operator') {
      return (
        requiredPermission === 'manage_orders' ||
        requiredPermission === 'moderate' ||
        requiredPermission === 'view_reports'
      );
    }
    return false;
  },
};

export default authService;
