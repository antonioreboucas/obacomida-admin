import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Promotion, PromotionStatus, AdminUser } from '../types';
import type {
  PlatformPromotion,
  CreatePromotionRequest,
  PlatformCoupon,
  CreateCouponRequest,
} from '../types/api';

export const promotionService = {
  /**
   * GET /api/v1/promotions
   * Lista campanhas promocionais ativas na plataforma
   */
  async fetchPromotions(): Promise<Promotion[]> {
    try {
      const data = await api.get<any>('/promotions');
      const list = Array.isArray(data) ? data : data?.items || data?.data;
      if (Array.isArray(list)) {
        const mapped = list.map((item) => this.normalizeFromApi(item));
        db.savePromotions(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API /promotions inacessível:', err);
    }

    if (!isMockEnabled()) {
      return [];
    }

    return this.getAll();
  },

  /**
   * POST /api/v1/promotions
   * Cria nova campanha promocional
   */
  async createPromotionApi(
    data: CreatePromotionRequest,
    admin: AdminUser
  ): Promise<Promotion> {
    let createdId = `promo-${Date.now()}`;

    try {
      const res = await api.post<any>('/promotions', data);
      const resData = res?.data || res;
      if (resData?.id) {
        createdId = String(resData.id);
      }
    } catch (err) {
      console.warn('Erro ao salvar promoção via POST /promotions, aplicando fallback local:', err);
    }

    const newPromotion: Promotion = {
      id: createdId,
      name: data.name,
      description: data.description || '',
      type: data.discount_type === 'PERCENTAGE' ? 'percent' : 'fixed',
      discountValue: data.discount_value,
      minOrderValue: data.min_order_value,
      startDate: data.starts_at,
      endDate: data.ends_at,
      budget: 5000,
      usedBudget: 0,
      maxUses: 1000,
      currentUses: 0,
      targetAudience: 'all',
      status: data.is_active ? 'Ativa' : 'Pausada',
      restaurantId: data.restaurant_id || undefined,
    };

    const promotions = db.getPromotions();
    db.savePromotions([newPromotion, ...promotions]);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Criação de campanha promocional via API',
      module: 'Promoções',
      entityId: newPromotion.id,
      details: `Campanha "${newPromotion.name}" criada (${data.discount_type}: ${data.discount_value})`,
      currentValue: JSON.stringify(newPromotion),
    });

    return newPromotion;
  },

  /**
   * POST /api/v1/promotions/coupons
   * Cria código promocional de cupom
   */
  async createCouponApi(
    data: CreateCouponRequest,
    admin: AdminUser
  ): Promise<PlatformCoupon> {
    try {
      const res = await api.post<any>('/promotions/coupons', data);
      const resData = res?.data || res;
      if (resData) {
        db.logAudit({
          adminId: admin.id,
          adminName: admin.name,
          adminRole: String(admin.role),
          action: 'Criação de cupom via API',
          module: 'Promoções',
          entityId: data.code,
          details: `Cupom "${data.code}" criado com desconto ${data.discount_value}`,
        });
        return resData;
      }
    } catch (err) {
      console.warn('Erro ao criar cupom via POST /promotions/coupons, aplicando fallback:', err);
    }

    const fallbackCoupon: PlatformCoupon = {
      id: `coupon-${Date.now()}`,
      code: data.code.toUpperCase(),
      name: data.name,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_value: data.min_order_value,
      max_uses: data.max_uses,
      current_uses: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return fallbackCoupon;
  },

  /**
   * GET /api/v1/promotions/coupons/{code}
   * Consulta status, validade e limite de usos de um cupom
   */
  async getCouponByCode(code: string): Promise<PlatformCoupon | undefined> {
    try {
      const data = await api.get<any>(`/promotions/coupons/${code.toUpperCase()}`);
      const payload = data?.data || data;
      if (payload && payload.code) {
        return payload;
      }
    } catch (err) {
      console.warn(`Cupom ${code} não encontrado na API:`, err);
    }

    return undefined;
  },

  getAll(): Promotion[] {
    return db.getPromotions();
  },

  getById(id: string): Promotion | undefined {
    return db.getPromotions().find((p) => p.id === id);
  },

  create(
    data: Omit<Promotion, 'id' | 'usedBudget' | 'currentUses'>,
    admin: AdminUser
  ): Promotion {
    const promotions = db.getPromotions();
    const newPromotion: Promotion = {
      ...data,
      id: `promo-${Date.now()}`,
      usedBudget: 0,
      currentUses: 0,
    };

    db.savePromotions([newPromotion, ...promotions]);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Criação de campanha promocional / cupom',
      module: 'Promoções',
      entityId: newPromotion.id,
      details: `Campanha "${newPromotion.name}" criada (Tipo: ${newPromotion.type}, Código: ${newPromotion.code || 'N/A'})`,
      currentValue: JSON.stringify(newPromotion),
    });

    return newPromotion;
  },

  update(id: string, updates: Partial<Promotion>, admin: AdminUser): Promotion | undefined {
    const promotions = db.getPromotions();
    const promo = promotions.find((p) => p.id === id);
    if (!promo) return undefined;

    const previous = { ...promo };
    const updated: Promotion = { ...promo, ...updates };

    db.savePromotions(promotions.map((p) => (p.id === id ? updated : p)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Atualização de campanha promocional',
      module: 'Promoções',
      entityId: id,
      details: `Campanha "${promo.name}" alterada`,
      previousValue: JSON.stringify({ status: previous.status, budget: previous.budget }),
      currentValue: JSON.stringify({ status: updated.status, budget: updated.budget }),
    });

    return updated;
  },

  toggleStatus(id: string, admin: AdminUser): Promotion | undefined {
    const promo = this.getById(id);
    if (!promo) return undefined;

    let newStatus: PromotionStatus = 'Ativa';
    if (promo.status === 'Ativa') newStatus = 'Pausada';
    else if (promo.status === 'Pausada') newStatus = 'Ativa';

    return this.update(id, { status: newStatus }, admin);
  },

  delete(id: string, admin: AdminUser): boolean {
    const promotions = db.getPromotions();
    const promo = promotions.find((p) => p.id === id);
    if (!promo) return false;

    db.savePromotions(promotions.filter((p) => p.id !== id));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Exclusão de campanha promocional',
      module: 'Promoções',
      entityId: id,
      details: `Campanha "${promo.name}" foi excluída`,
    });

    return true;
  },

  normalizeFromApi(item: any): Promotion {
    return {
      id: String(item.id),
      name: item.name || 'Promoção',
      code: item.code,
      type: item.discount_type === 'PERCENTAGE' ? 'percent' : 'fixed',
      discountValue: Number(item.discount_value ?? 10),
      minOrderValue: Number(item.min_order_value ?? 20),
      startDate: item.starts_at || new Date().toISOString(),
      endDate: item.ends_at || new Date().toISOString(),
      budget: Number(item.budget ?? 5000),
      usedBudget: Number(item.used_budget ?? 0),
      maxUses: Number(item.max_uses ?? 500),
      currentUses: Number(item.current_uses ?? 0),
      targetAudience: 'all',
      status: item.is_active ? 'Ativa' : 'Pausada',
      restaurantId: item.restaurant_id,
      restaurantName: item.restaurant_name,
      description: item.description || '',
    };
  },
};

export default promotionService;
