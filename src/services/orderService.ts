import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Order, OrderStatus, AdminUser } from '../types';

export const orderService = {
  /**
   * GET /api/v1/admin/orders?status=&restaurant_id=&start_date=&end_date=
   * Lista todos os pedidos da plataforma com filtros
   */
  async fetchAdminOrders(filters?: {
    status?: string;
    restaurant_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Order[]> {
    try {
      const params: Record<string, any> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.restaurant_id && filters.restaurant_id !== 'all') params.restaurant_id = filters.restaurant_id;
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;

      let data: any = null;
      try {
        data = await api.get<any>('/admin/orders', params);
      } catch (adminErr: any) {
        if (adminErr?.status === 403 || adminErr?.status === 404) {
          data = await api.get<any>('/orders', params);
        } else {
          throw adminErr;
        }
      }

      const rawList = Array.isArray(data) ? data : (data?.items || data?.data);
      const list = Array.isArray(rawList) ? rawList : (rawList?.items || []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((item) => this.normalizeFromApi(item));
        db.saveOrders(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API de pedidos sem registros ou inacessível, utilizando pedidos iniciais:', err);
    }

    const all = db.getOrders();
    return all.filter((o) => {
      if (filters?.status && filters.status !== 'all' && o.status !== filters.status) return false;
      if (filters?.restaurant_id && filters.restaurant_id !== 'all' && o.restaurantId !== filters.restaurant_id) return false;
      if (filters?.start_date && new Date(o.createdAt) < new Date(filters.start_date)) return false;
      if (filters?.end_date && new Date(o.createdAt) > new Date(filters.end_date)) return false;
      return true;
    });
  },

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
      adminRole: String(admin.role),
      action: 'Intervenção no status do pedido',
      module: 'Pedidos',
      entityId: order.code,
      details: `Pedido ${order.code} alterado de "${order.status}" para "${newStatus}". Justificativa: ${note || 'Intervenção operacional'}`,
      previousValue: order.status,
      currentValue: newStatus,
    });

    return updated;
  },

  addOccurrence(
    id: string,
    typeOrObj: string | { type: string; description: string },
    descriptionOrAdmin: string | AdminUser,
    adminUser?: AdminUser
  ): Order | undefined {
    const orders = db.getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) return undefined;

    let type = '';
    let description = '';
    let admin: AdminUser;

    if (typeof typeOrObj === 'object') {
      type = typeOrObj.type;
      description = typeOrObj.description;
      admin = descriptionOrAdmin as AdminUser;
    } else {
      type = typeOrObj;
      description = descriptionOrAdmin as string;
      admin = adminUser!;
    }

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
      adminRole: String(admin.role),
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
      adminRole: String(admin.role),
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

  normalizeFromApi(item: any): Order {
    return {
      id: String(item.id),
      code: item.code || `#OBA-${String(item.id).slice(-4)}`,
      customerId: item.customer_id || item.customerId || 'cust-1',
      customerName: item.customer_name || item.customerName || 'Cliente',
      customerPhone: item.customer_phone || item.customerPhone || '(11) 99999-9999',
      restaurantId: item.restaurant_id || item.restaurantId || 'rest-1',
      restaurantName: item.restaurant_name || item.restaurantName || 'Restaurante',
      items: Array.isArray(item.items)
        ? item.items.map((i: any) => ({
            id: String(i.id || Math.random()),
            productId: i.product_id || i.productId || '',
            productName: i.product_name || i.productName || 'Item',
            quantity: Number(i.quantity ?? 1),
            unitPrice: Number(i.unit_price ?? i.unitPrice ?? 0),
            totalPrice: Number(i.total_price ?? i.totalPrice ?? 0),
            notes: i.notes,
          }))
        : [],
      subtotal: Number(item.subtotal ?? 0),
      deliveryFee: Number(item.delivery_fee ?? item.deliveryFee ?? 0),
      serviceFee: Number(item.service_fee ?? item.serviceFee ?? 0),
      discount: Number(item.discount ?? 0),
      totalAmount: Number(item.total_amount ?? item.totalAmount ?? 0),
      paymentMethod: item.payment_method || item.paymentMethod || 'Pix',
      status: item.status || 'Criado',
      deliveryType: item.delivery_type || item.deliveryType || 'Entrega',
      deliveryAddress: item.delivery_address || item.deliveryAddress || '',
      city: item.city || 'São Paulo',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      estimatedDeliveryTime: item.estimated_delivery_time || item.estimatedDeliveryTime,
      statusHistory: Array.isArray(item.status_history) ? item.status_history : [],
      occurrences: Array.isArray(item.occurrences) ? item.occurrences : [],
    };
  },
};
