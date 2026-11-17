import { db } from '../storage/db';
import type { Restaurant, RestaurantStatus, AdminUser, StoreTheme } from '../types';
import { generateSlug, sanitizeSlug, getStoreAppUrl, getStorePartnerUrl } from '../utils/slugUtils';

export const restaurantService = {
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
