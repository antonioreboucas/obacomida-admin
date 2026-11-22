import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import { categoryService } from './categoryService';
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
  CreateRestaurantRequest,
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
          try {
            data = await api.get<any>('/partners/restaurants', queryParams);
          } catch {
            data = await api.get<any>('/restaurants', queryParams);
          }
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

  /**
   * Atualiza dados cadastrais, operacionais e visuais do restaurante na API central e no banco local
   * PUT /api/v1/partners/restaurants/{id}/settings (com fallback)
   */
  async updateApi(
    id: string,
    updates: Partial<Restaurant>,
    admin: AdminUser,
    reason?: string
  ): Promise<Restaurant | undefined> {
    const token = api.getToken();

    if (token) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.trade_name = updates.name.trim();
        if (updates.ownerName !== undefined) payload.corporate_name = updates.ownerName.trim();
        if (updates.phone !== undefined) payload.phone = updates.phone.trim();
        if (updates.email !== undefined) payload.email = updates.email.trim();
        if (updates.logo !== undefined) payload.logo_url = updates.logo;
        if (updates.coverImage !== undefined) payload.banner_url = updates.coverImage;
        if (updates.minimumOrder !== undefined) payload.minimum_order = Number(updates.minimumOrder);
        if (updates.deliveryFee !== undefined) payload.delivery_fee = Number(updates.deliveryFee);
        if (updates.deliveryTimeMin !== undefined) payload.average_delivery_time_min = Number(updates.deliveryTimeMin);
        if (updates.deliveryTimeMax !== undefined) payload.average_delivery_time_max = Number(updates.deliveryTimeMax);
        if (updates.isOpen !== undefined) payload.is_open = Boolean(updates.isOpen);

        if (updates.categoryId) {
          payload.global_category_id = updates.categoryId;
        }

        if (updates.theme) {
          payload.theme = {
            primary_color: updates.theme.primaryColor,
            secondary_color: updates.theme.secondaryColor,
            preset_key: updates.theme.presetKey,
            text_color: updates.theme.textColor,
          };
        }

        const endpoints = [
          `/partners/restaurants/${id}/settings`,
          `/admin/restaurants/${id}`,
          `/restaurants/${id}`,
        ];

        for (const ep of endpoints) {
          try {
            await api.put(ep, payload);
            break;
          } catch (putErr: any) {
            if (putErr?.status === 404 || putErr?.status === 405) {
              continue;
            }
            console.warn(`Tentativa de PUT em ${ep} falhou:`, putErr);
            break;
          }
        }

        if (updates.slug) {
          try {
            await this.updateSlugApi(id, updates.slug, admin);
          } catch (slugErr) {
            console.warn('Erro ao atualizar slug na API:', slugErr);
          }
        }

        if (updates.commissionRate !== undefined || updates.fixedFee !== undefined) {
          try {
            await this.updateCommissionApi(
              id,
              updates.commissionRate ?? 12.0,
              updates.fixedFee ?? 1.5,
              admin,
              reason || 'Atualização cadastral'
            );
          } catch (commErr) {
            console.warn('Erro ao atualizar comissão na API:', commErr);
          }
        }
      } catch (err) {
        console.warn('Erro ao atualizar restaurante na API central:', err);
      }
    }

    return this.update(id, updates, admin, reason);
  },

  /**
   * POST /api/v1/admin/restaurants (com fallback para /api/v1/restaurants)
   * Cadastra novo restaurante diretamente no banco de dados via API Central FastAPI
   */
  async createApi(
    data: {
      name: string;
      ownerName: string;
      cnpj: string;
      phone: string;
      email: string;
      categoryId: string;
      category?: string;
      slug?: string;
      city?: string;
      state?: string;
      address?: string;
      zipCode?: string;
      commissionRate?: number;
      fixedFee?: number;
      minimumOrder?: number;
      deliveryTimeMin?: number;
      deliveryTimeMax?: number;
      deliveryFee?: number;
      logo?: string;
      coverImage?: string;
      status?: RestaurantStatus;
      theme?: StoreTheme;
    },
    admin: AdminUser
  ): Promise<Restaurant> {
    const backendStatus =
      data.status && STATUS_TO_BACKEND[data.status]
        ? STATUS_TO_BACKEND[data.status]
        : 'ACTIVE';

    const cleanSlug = data.slug ? sanitizeSlug(data.slug) : generateSlug(data.name);

    // Resolver UUID válido de categoria existente no banco
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let categoryId = data.categoryId;

    if (!categoryId || !UUID_REGEX.test(categoryId)) {
      try {
        const liveCats = await categoryService.fetchCategories();
        const match =
          liveCats.find((c) => c.id === categoryId) ||
          liveCats.find((c) => c.name.toLowerCase() === (data.category || '').toLowerCase()) ||
          liveCats.find((c) => UUID_REGEX.test(c.id)) ||
          liveCats[0];
        if (match && UUID_REGEX.test(match.id)) {
          categoryId = match.id;
        }
      } catch (catErr) {
        console.warn('Erro ao resolver UUID da categoria:', catErr);
      }
    }

    // Sanitizar CNPJ (mínimo 14 caracteres)
    const rawCnpj = (data.cnpj || '').trim();
    const cleanCnpj = rawCnpj.length >= 14 ? rawCnpj : rawCnpj.padStart(14, '0');

    // Separar rua, número e bairro do endereço informado
    const addressParts = (data.address || '').split(',').map((p) => p.trim());
    const street = addressParts[0] || (data.address || '').trim() || 'Rua Principal';
    const number = addressParts[1] || 'S/N';
    const neighborhood = addressParts[2] || 'Centro';
    const city = (data.city || 'São Paulo').trim() || 'São Paulo';
    const state = (data.state || 'SP').trim().toUpperCase().slice(0, 2) || 'SP';
    const postalCode = (data.zipCode || '01000-000').trim() || '01000-000';

    const payload: CreateRestaurantRequest = {
      trade_name: data.name.trim(),
      corporate_name: (data.ownerName || data.name).trim(),
      cnpj: cleanCnpj,
      global_category_id: categoryId,
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
      slug: cleanSlug,
      status: backendStatus as any,
      commission_rate: Number(data.commissionRate ?? 12.0),
      commission_percentage: Number(data.commissionRate ?? 12.0),
      fixed_fee: Number(data.fixedFee ?? 1.50),
      minimum_order: Number(data.minimumOrder ?? 20.0),
      delivery_fee: Number(data.deliveryFee ?? 5.0),
      average_delivery_time_min: Math.max(10, Number(data.deliveryTimeMin ?? 25)),
      average_delivery_time_max: Math.max(15, Number(data.deliveryTimeMax ?? 45)),
      logo_url: data.logo || undefined,
      banner_url: data.coverImage || undefined,
      owner_email: (data.email || '').trim(),
      address: {
        street,
        number,
        neighborhood,
        city,
        state,
        postal_code: postalCode,
      },
    };

    if (data.theme) {
      payload.theme = {
        primary_color: data.theme.primaryColor,
        secondary_color: data.theme.secondaryColor,
        preset_key: data.theme.presetKey,
        text_color: data.theme.textColor,
      };
    }

    let createdData: any = null;
    let lastError: any = null;

    // Tentamos /restaurants (suportado para parceiros/admins) e /admin/restaurants
    const endpointsToTry = ['/restaurants', '/admin/restaurants'];

    for (const endpoint of endpointsToTry) {
      try {
        createdData = await api.post<any>(endpoint, payload);
        if (createdData) break;
      } catch (err: any) {
        lastError = err;
        if (err?.status === 403 || err?.status === 404) {
          continue;
        }
        throw err;
      }
    }

    if (!createdData && lastError) {
      console.warn('Erro ao salvar restaurante na API central:', lastError);
      if (!isMockEnabled()) {
        throw lastError;
      }
    }

    if (createdData) {
      const normalized = this.normalizeFromApi(createdData);
      const current = db.getRestaurants();
      db.saveRestaurants([normalized, ...current.filter((r) => r.id !== normalized.id)]);
      db.logAudit({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'Cadastro de estabelecimento',
        module: 'Restaurantes',
        entityId: normalized.id,
        details: `Restaurante ${normalized.name} cadastrado com sucesso via API no banco de dados.`,
        currentValue: JSON.stringify({ name: normalized.name, slug: normalized.slug, cnpj: normalized.cnpj, status: normalized.status }),
      });
      return normalized;
    }

    // Fallback local se mock habilitado
    return this.create(
      {
        ...data,
        slug: cleanSlug,
        name: data.name,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email,
        city: data.city || 'São Paulo',
        state: data.state || 'SP',
        address: data.address || '',
        zipCode: data.zipCode || '01000-000',
        cnpj: data.cnpj,
        category: data.category || 'Restaurantes',
        categoryId: data.categoryId,
        commissionRate: data.commissionRate ?? 12.0,
        fixedFee: data.fixedFee ?? 1.5,
        minimumOrder: data.minimumOrder ?? 20.0,
        deliveryTimeMin: data.deliveryTimeMin ?? 25,
        deliveryTimeMax: data.deliveryTimeMax ?? 45,
        deliveryFee: data.deliveryFee ?? 5.0,
        logo: data.logo || '',
        coverImage: data.coverImage || '',
        isOpen: true,
        status: data.status || 'Ativo',
        theme: data.theme,
      },
      admin
    );
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

    const rawAddress = item.address;
    let formattedAddress = '';
    let city = item.city || 'São Paulo';
    let state = item.state || 'SP';
    let zipCode = item.zip_code || item.zipCode || '01000-000';

    if (rawAddress && typeof rawAddress === 'object') {
      const parts = [
        rawAddress.street,
        rawAddress.number ? `nº ${rawAddress.number}` : '',
        rawAddress.neighborhood,
      ].filter(Boolean);
      formattedAddress = parts.join(', ');
      if (rawAddress.city) city = rawAddress.city;
      if (rawAddress.state) state = rawAddress.state;
      if (rawAddress.postal_code || rawAddress.zip_code) {
        zipCode = rawAddress.postal_code || rawAddress.zip_code;
      }
    } else if (typeof rawAddress === 'string') {
      formattedAddress = rawAddress;
    }

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
      city,
      state,
      address: formattedAddress,
      zipCode,
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
          action: `Estabelecimento cadastrado com links personalizados (App: https://app-obacomida.vercel.app/${finalSlug} | Parceiro: https://obacomida-partner.vercel.app/${finalSlug})`,
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
      `Link personalizado da loja atualizado para "${clean}" (App: https://app-obacomida.vercel.app/${clean} | Painel Parceiro: https://obacomida-partner.vercel.app/${clean})`
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
