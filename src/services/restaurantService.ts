import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type {
  Restaurant,
  RestaurantStatus,
  AdminUser,
  StoreTheme,
  BackendRestaurantStatus,
} from '../types';
import type {
  RestaurantQueryParams,
  CheckSlugResponse,
  RestaurantDetail,
  RestaurantListItem,
} from '../types/api';
import { generateSlug, sanitizeSlug, getStoreAppUrl, getStorePartnerUrl } from '../utils/slugUtils';

const STATUS_TO_BACKEND: Record<string, BackendRestaurantStatus> = {
  Pendente: 'PENDING',
  'Em análise': 'UNDER_REVIEW' as any,
  Aprovado: 'APPROVED',
  Ativo: 'ACTIVE',
  Pausado: 'PAUSED',
  Suspenso: 'SUSPENDED',
  Reprovado: 'REJECTED',
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW' as any,
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
};

const BACKEND_TO_LEGACY: Record<string, RestaurantStatus> = {
  PENDING: 'Pendente',
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovado',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  SUSPENDED: 'Suspenso',
  REJECTED: 'Reprovado',
};

export const restaurantService = {
  /**
   * GET /api/v1/admin/restaurants?status=&city=&search=&page=&per_page=
   * Lista restaurantes da fila administrativa com paginação e filtros
   */
  async fetchAdminRestaurants(
    paramsOrStatus?: string | RestaurantQueryParams
  ): Promise<any> {
    const isParamObject = typeof paramsOrStatus === 'object';
    const statusFilter = isParamObject ? paramsOrStatus?.status : paramsOrStatus;
    const city = isParamObject ? paramsOrStatus?.city : undefined;
    const search = isParamObject ? paramsOrStatus?.search : undefined;
    const page = isParamObject ? paramsOrStatus?.page || 1 : 1;
    const perPage = isParamObject ? paramsOrStatus?.per_page || 20 : 50;

    try {
      const backendStatus =
        statusFilter && statusFilter !== 'all'
          ? STATUS_TO_BACKEND[statusFilter] || statusFilter
          : undefined;

      const queryParams: Record<string, any> = { page, per_page: perPage };
      if (backendStatus) queryParams.status = backendStatus;
      if (city && city !== 'all') queryParams.city = city;
      if (search) queryParams.search = search;

      let data: any = null;
      try {
        data = await api.get<any>('/admin/restaurants', queryParams);
      } catch (adminErr: any) {
        if (adminErr?.status === 403 || adminErr?.status === 404) {
          data = await api.get<any>('/restaurants', queryParams);
        } else {
          throw adminErr;
        }
      }

      const rawList = Array.isArray(data) ? data : data?.items || data?.data;
      const list = Array.isArray(rawList) ? rawList : rawList?.items || [];
      const total = data?.total || (Array.isArray(data) ? data.length : list.length);

      if (Array.isArray(list)) {
        const mapped = list.map((item) => this.normalizeFromApi(item));
        db.saveRestaurants(mapped);

        if (isParamObject) {
          return { items: mapped, total, page, per_page: perPage };
        }
        return mapped;
      }
    } catch (err) {
      console.warn('API de restaurantes inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return isParamObject ? { items: [], total: 0, page, per_page: perPage } : [];
    }

    const all = db.getRestaurants();
    const filtered = all.filter((r) => {
      const matchStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        r.status === statusFilter ||
        STATUS_TO_BACKEND[r.status] === statusFilter;
      const matchCity = !city || city === 'all' || r.city.toLowerCase() === city.toLowerCase();
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cnpj.includes(search) ||
        r.slug.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCity && matchSearch;
    });

    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    if (isParamObject) {
      return { items: paginated, total: filtered.length, page, per_page: perPage };
    }
    return filtered;
  },

  /**
   * GET /api/v1/restaurants/{id}
   * Detalhes completos do restaurante
   */
  async fetchRestaurantById(id: string): Promise<Restaurant | undefined> {
    try {
      const data = await api.get<any>(`/restaurants/${id}`);
      if (data && (data.id || data.name)) {
        return this.normalizeFromApi(data);
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn(`Erro ao carregar restaurante ${id} da API central:`, err);
        return undefined;
      }
    }
    return this.getById(id);
  },

  /**
   * PATCH /api/v1/admin/restaurants/{id}/status
   * Payload: { status: "APPROVED" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "REJECTED", reason?: string }
   */
  async updateStatusApi(
    id: string,
    newStatus: RestaurantStatus,
    admin: AdminUser,
    reason?: string
  ): Promise<Restaurant | undefined> {
    const backendStatus = STATUS_TO_BACKEND[newStatus] || (newStatus as BackendRestaurantStatus);

    try {
      await api.patch(`/admin/restaurants/${id}/status`, {
        status: backendStatus,
        reason: reason || undefined,
      });
    } catch (err) {
      console.warn('Erro ao atualizar status via API, aplicando fallback local:', err);
    }

    // Update local DB and audit trail
    return this.updateStatus(id, newStatus, admin, reason);
  },

  /**
   * GET /api/v1/admin/restaurants/check-slug?slug=exemplo&exclude_id=uuid
   * Validação em tempo real se o slug está livre
   */
  async checkSlugApi(slug: string, excludeId?: string): Promise<CheckSlugResponse> {
    const clean = sanitizeSlug(slug);
    if (!clean || clean.length < 3) {
      return { available: false, slug: clean, message: 'O link deve ter no mínimo 3 caracteres.' };
    }

    try {
      const params: Record<string, string> = { slug: clean };
      if (excludeId) params.exclude_id = excludeId;

      const res = await api.get<any>('/admin/restaurants/check-slug', params);
      const data: CheckSlugResponse = res?.data || res;
      if (typeof data?.available === 'boolean') {
        return data;
      }
    } catch (err) {
      // Fallback local check
    }

    const available = this.isSlugAvailable(clean, excludeId);
    return {
      available,
      slug: clean,
      message: available ? 'Link disponível!' : 'Este link já está em uso por outro restaurante.',
    };
  },

  /**
   * PATCH /api/v1/admin/restaurants/{id}/slug
   * Payload: { slug: string }
   */
  async updateSlugApi(
    id: string,
    newSlug: string,
    admin: AdminUser
  ): Promise<{ success: boolean; error?: string; restaurant?: Restaurant }> {
    const clean = sanitizeSlug(newSlug);
    if (!clean || clean.length < 3) {
      return { success: false, error: 'O link deve ter no mínimo 3 caracteres.' };
    }

    try {
      await api.patch(`/admin/restaurants/${id}/slug`, { slug: clean });
    } catch (err: any) {
      console.warn('Erro ao atualizar slug via API, aplicando fallback local:', err);
    }

    return this.updateSlug(id, clean, admin);
  },

  /**
   * PATCH /api/v1/admin/restaurants/{id}/theme
   * Payload: { theme: { primary_color, secondary_color, ... } }
   */
  async updateThemeApi(
    id: string,
    theme: StoreTheme,
    admin: AdminUser
  ): Promise<Restaurant | undefined> {
    try {
      await api.patch(`/admin/restaurants/${id}/theme`, {
        theme: {
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          preset_key: theme.presetKey,
          text_color: theme.textColor,
        },
      });
    } catch (err) {
      console.warn('Erro ao atualizar tema via API, aplicando fallback local:', err);
    }

    return this.updateTheme(id, theme, admin);
  },

  /**
   * PATCH /api/v1/admin/restaurants/{id}/commission
   * Payload: { commission_rate: 0.12 }
   */
  async updateCommissionApi(
    id: string,
    commissionRate: number,
    fixedFee: number,
    admin: AdminUser,
    justification: string
  ): Promise<Restaurant | undefined> {
    try {
      const rateDecimal = commissionRate > 1 ? commissionRate / 100 : commissionRate;
      await api.patch(`/admin/restaurants/${id}/commission`, {
        commission_rate: rateDecimal,
        fixed_fee: fixedFee,
        justification,
      });
    } catch (err) {
      console.warn('Erro ao atualizar comissão via API, aplicando fallback local:', err);
    }

    return this.updateCommission(id, commissionRate, fixedFee, admin, justification);
  },

  normalizeFromApi(item: any): Restaurant {
    const rawName = item.trade_name || item.name || item.corporate_name || 'Restaurante';
    const slug = item.slug || generateSlug(rawName || 'loja');
    const rawRate = Number(item.commission_rate ?? item.commissionRate ?? 0.12);
    const commissionRate = rawRate <= 1 && rawRate > 0 ? Number((rawRate * 100).toFixed(1)) : rawRate;

    const theme = item.theme
      ? {
          primaryColor: item.theme.primary_color || item.theme.primaryColor || '#ff6600',
          secondaryColor: item.theme.secondary_color || item.theme.secondaryColor || '#ff8833',
          presetKey: item.theme.preset_key || item.theme.presetKey,
          textColor: item.theme.text_color || item.theme.textColor,
        }
      : undefined;

    return {
      id: String(item.id),
      name: rawName,
      slug,
      appUrl: item.app_url || item.appUrl || getStoreAppUrl(slug),
      partnerUrl: item.partner_url || item.partnerUrl || getStorePartnerUrl(slug),
      logo: item.logo_url || item.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
      coverImage: item.banner_url || item.cover_image || item.coverImage,
      category: item.global_category_name || item.category_name || item.category || 'Restaurantes',
      categoryId: item.global_category_id || item.category_id || item.categoryId || 'cat-1',
      ownerName: item.owner_name || item.ownerName || item.corporate_name || 'Responsável',
      phone: item.phone || '(11) 99999-9999',
      email: item.email || 'contato@restaurante.com.br',
      city: item.city || 'São Paulo',
      state: item.state || 'SP',
      address: item.address || '',
      zipCode: item.zip_code || item.zipCode || '01000-000',
      cnpj: item.cnpj || '00.000.000/0001-00',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      status: BACKEND_TO_LEGACY[item.status] || item.status || 'Ativo',
      rating: Number(item.rating ?? 5.0),
      totalOrders: Number(item.total_orders ?? item.totalOrders ?? 0),
      totalRevenue: Number(item.total_revenue ?? item.totalRevenue ?? 0),
      commissionRate,
      fixedFee: Number(item.fixed_fee ?? item.fixedFee ?? 1.5),
      minimumOrder: Number(item.minimum_order ?? item.minimumOrder ?? 20.0),
      deliveryTimeMin: Number(item.average_delivery_time_min ?? item.delivery_time_min ?? item.deliveryTimeMin ?? 25),
      deliveryTimeMax: Number(item.average_delivery_time_max ?? item.delivery_time_max ?? item.deliveryTimeMax ?? 45),
      deliveryFee: Number(item.delivery_fee ?? item.deliveryFee ?? 5.0),
      isOpen: item.is_open ?? item.isOpen ?? true,
      theme,
      history: Array.isArray(item.history) ? item.history : [],
    };
  },

  getAll(): Restaurant[] {
    return db.getRestaurants();
  },

  getById(id: string): Restaurant | undefined {
    return db.getRestaurants().find((r) => r.id === id);
  },

  getBySlug(slug: string): Restaurant | undefined {
    const clean = sanitizeSlug(slug);
    return db.getRestaurants().find((r) => r.slug === clean);
  },

  isSlugAvailable(slug: string, excludeId?: string): boolean {
    const clean = sanitizeSlug(slug);
    if (!clean) return false;
    return !db.getRestaurants().some((r) => r.slug === clean && r.id !== excludeId);
  },

  create(
    data: Omit<Restaurant, 'id' | 'createdAt' | 'rating' | 'totalOrders' | 'totalRevenue' | 'history'>,
    admin: AdminUser
  ): Restaurant {
    const restaurants = db.getRestaurants();

    const baseSlug = data.slug ? sanitizeSlug(data.slug) : generateSlug(data.name);
    let finalSlug = baseSlug || `loja-${Date.now()}`;
    let counter = 1;
    while (restaurants.some((r) => r.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newRest: Restaurant = {
      ...data,
      slug: finalSlug,
      appUrl: getStoreAppUrl(finalSlug),
      partnerUrl: getStorePartnerUrl(finalSlug),
      id: `rest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      rating: 5.0,
      totalOrders: 0,
      totalRevenue: 0,
      history: [
        {
          date: new Date().toISOString(),
          action: `Estabelecimento cadastrado com links personalizados (App: obacomida.com.br/${finalSlug}-app | Parceiro: obacomida.com.br/${finalSlug})`,
          adminName: admin.name,
        },
      ],
    };

    db.saveRestaurants([newRest, ...restaurants]);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Cadastro de estabelecimento',
      module: 'Restaurantes',
      entityId: newRest.id,
      details: `Cadastrado restaurante ${newRest.name} (Slug: ${finalSlug})`,
      currentValue: JSON.stringify({ name: newRest.name, slug: finalSlug, cnpj: newRest.cnpj, status: newRest.status }),
    });

    return newRest;
  },

  update(id: string, updates: Partial<Restaurant>, admin: AdminUser, reason?: string): Restaurant | undefined {
    const restaurants = db.getRestaurants();
    const target = restaurants.find((r) => r.id === id);
    if (!target) return undefined;

    const previous = { ...target };
    const historyEntry = {
      date: new Date().toISOString(),
      action: reason || 'Dados cadastrais atualizados pela administração',
      adminName: admin.name,
    };

    let finalUpdates = { ...updates };
    if (updates.slug) {
      const clean = sanitizeSlug(updates.slug);
      finalUpdates.slug = clean;
      finalUpdates.appUrl = getStoreAppUrl(clean);
      finalUpdates.partnerUrl = getStorePartnerUrl(clean);
    }

    const updated: Restaurant = {
      ...target,
      ...finalUpdates,
      history: [historyEntry, ...target.history],
    };

    db.saveRestaurants(restaurants.map((r) => (r.id === id ? updated : r)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Atualização de dados do restaurante',
      module: 'Restaurantes',
      entityId: id,
      details: `Restaurante ${target.name} atualizado. ${reason || ''}`,
      previousValue: JSON.stringify({ status: previous.status, slug: previous.slug, commission: previous.commissionRate }),
      currentValue: JSON.stringify({ status: updated.status, slug: updated.slug, commission: updated.commissionRate }),
    });

    return updated;
  },

  updateSlug(
    id: string,
    newSlug: string,
    admin: AdminUser
  ): { success: boolean; error?: string; restaurant?: Restaurant } {
    const clean = sanitizeSlug(newSlug);
    if (!clean || clean.length < 3) {
      return { success: false, error: 'O link da loja deve ter no mínimo 3 caracteres (apenas letras, números e hífens).' };
    }
    if (!this.isSlugAvailable(clean, id)) {
      return { success: false, error: `O link "${clean}" já está em uso por outro restaurante.` };
    }
    const updated = this.update(
      id,
      { slug: clean },
      admin,
      `Link personalizado da loja atualizado para "${clean}" (App: obacomida.com.br/${clean}-app | Painel Parceiro: obacomida.com.br/${clean})`
    );
    return { success: true, restaurant: updated };
  },

  updateStatus(id: string, newStatus: RestaurantStatus, admin: AdminUser, reason?: string): Restaurant | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const actionText = `Status alterado de "${target.status}" para "${newStatus}"${reason ? ` - Motivo: ${reason}` : ''}`;
    return this.update(id, { status: newStatus }, admin, actionText);
  },

  approve(id: string, admin: AdminUser): Restaurant | undefined {
    return this.updateStatus(id, 'Ativo', admin, 'Cadastro homologado e ativado para vendas');
  },

  reject(id: string, admin: AdminUser, reason: string): Restaurant | undefined {
    return this.updateStatus(id, 'Reprovado', admin, reason || 'Documentação em desacordo');
  },

  suspend(id: string, admin: AdminUser, reason: string): Restaurant | undefined {
    return this.updateStatus(id, 'Suspenso', admin, reason || 'Suspensão operacional preventiva');
  },

  activate(id: string, admin: AdminUser): Restaurant | undefined {
    return this.updateStatus(id, 'Ativo', admin, 'Reativação de restaurante');
  },

  updateCommission(
    id: string,
    commissionRate: number,
    fixedFee: number,
    admin: AdminUser,
    justification: string
  ): Restaurant | undefined {
    return this.update(
      id,
      { commissionRate, fixedFee },
      admin,
      `Comissão alterada para ${commissionRate}% e taxa fixa R$ ${fixedFee.toFixed(2)}. Justificativa: ${justification}`
    );
  },

  updateTheme(
    id: string,
    theme: StoreTheme,
    admin: AdminUser
  ): Restaurant | undefined {
    return this.update(
      id,
      { theme },
      admin,
      `Tema visual da loja alterado (Primária: ${theme.primaryColor}, Secundária: ${theme.secondaryColor})`
    );
  },
};

export default restaurantService;
