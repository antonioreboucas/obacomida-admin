import { db } from '../storage/db';
import type { Restaurant, RestaurantStatus, AdminUser } from '../types';

export const restaurantService = {
  getAll(): Restaurant[] {
    return db.getRestaurants();
  },

  getById(id: string): Restaurant | undefined {
    return db.getRestaurants().find((r) => r.id === id);
  },

  create(
    data: Omit<Restaurant, 'id' | 'createdAt' | 'rating' | 'totalOrders' | 'totalRevenue' | 'history'>,
    admin: AdminUser
  ): Restaurant {
    const restaurants = db.getRestaurants();
    const newRest: Restaurant = {
      ...data,
      id: `rest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      rating: 5.0,
      totalOrders: 0,
      totalRevenue: 0,
      history: [
        {
          date: new Date().toISOString(),
          action: 'Estabelecimento cadastrado manualmente pela administração',
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
      details: `Cadastrado restaurante ${newRest.name} em ${newRest.city}/${newRest.state}`,
      currentValue: JSON.stringify({ name: newRest.name, cnpj: newRest.cnpj, status: newRest.status }),
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

    const updated: Restaurant = {
      ...target,
      ...updates,
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
      previousValue: JSON.stringify({ status: previous.status, commission: previous.commissionRate }),
      currentValue: JSON.stringify({ status: updated.status, commission: updated.commissionRate }),
    });

    return updated;
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
};
