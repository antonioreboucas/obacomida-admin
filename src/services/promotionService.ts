import { db } from '../storage/db';
import type { Promotion, PromotionStatus, AdminUser } from '../types';

export const promotionService = {
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
      adminRole: admin.role,
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
      adminRole: admin.role,
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
      adminRole: admin.role,
      action: 'Exclusão de campanha promocional',
      module: 'Promoções',
      entityId: id,
      details: `Campanha "${promo.name}" foi excluída`,
    });

    return true;
  },
};
