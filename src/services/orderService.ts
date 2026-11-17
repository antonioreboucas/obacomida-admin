import { db } from '../storage/db';
import type { Order, OrderStatus, AdminUser } from '../types';

export const orderService = {
  getAll(): Order[] {
    return db.getOrders();
  },

  getById(id: string): Order | undefined {
    return db.getOrders().find((o) => o.id === id || o.code.toLowerCase() === id.toLowerCase());
  },

  getByRestaurantId(restaurantId: string): Order[] {
    return db.getOrders().filter((o) => o.restaurantId === restaurantId);
  },

  getByCustomerId(customerId: string): Order[] {
    return db.getOrders().filter((o) => o.customerId === customerId);
  },

  updateStatus(
    id: string,
    newStatus: OrderStatus,
    admin: AdminUser,
    note?: string
  ): Order | undefined {
    const orders = db.getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) return undefined;

    const historyEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status alterado manualmente para ${newStatus}`,
      adminName: admin.name,
    };

    const updated: Order = {
      ...order,
      status: newStatus,
      statusHistory: [...order.statusHistory, historyEntry],
    };

    db.saveOrders(orders.map((o) => (o.id === id ? updated : o)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Intervenção no status do pedido',
      module: 'Pedidos',
      entityId: order.code,
      details: `Pedido ${order.code} alterado de "${order.status}" para "${newStatus}". ${note || ''}`,
      previousValue: order.status,
      currentValue: newStatus,
    });

    return updated;
  },

  addOccurrence(
    id: string,
    type: string,
    description: string,
    admin: AdminUser
  ): Order | undefined {
    const orders = db.getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) return undefined;

    const newOccurrence = {
      id: `occ-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      description,
      resolved: false,
    };

    const updated: Order = {
      ...order,
      occurrences: [newOccurrence, ...order.occurrences],
    };

    db.saveOrders(orders.map((o) => (o.id === id ? updated : o)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Registro de ocorrência no pedido',
      module: 'Pedidos',
      entityId: order.code,
      details: `Nova ocorrência: ${type} - ${description}`,
    });

    return updated;
  },

  resolveOccurrence(
    orderId: string,
    occurrenceId: string,
    resolutionNote: string,
    admin: AdminUser
  ): Order | undefined {
    const orders = db.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return undefined;

    const updatedOccurrences = order.occurrences.map((occ) =>
      occ.id === occurrenceId ? { ...occ, resolved: true, resolutionNote } : occ
    );

    const updated: Order = { ...order, occurrences: updatedOccurrences };
    db.saveOrders(orders.map((o) => (o.id === orderId ? updated : o)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Resolução de ocorrência',
      module: 'Pedidos',
      entityId: order.code,
      details: `Ocorrência #${occurrenceId} resolvida: ${resolutionNote}`,
    });

    return updated;
  },

  cancelOrder(id: string, reason: string, admin: AdminUser): Order | undefined {
    return this.updateStatus(id, 'Cancelado', admin, `Cancelamento administrativo: ${reason}`);
  },
};
