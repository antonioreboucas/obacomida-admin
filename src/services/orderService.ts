import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Order, OrderStatus, AdminUser } from '../types';
import type {
  OrdersQueryParams,
  OrderDetailFull,
  BackendOrderStatus,
} from '../types/api';

const BACKEND_STATUS_MAP: Record<string, BackendOrderStatus> = {
  Criado: 'PENDING',
  Confirmado: 'CONFIRMED',
  'Em preparação': 'PREPARING',
  'Pronto para retirada': 'READY_FOR_PICKUP',
  'Saiu para entrega': 'OUT_FOR_DELIVERY',
  Entregue: 'DELIVERED',
  Cancelado: 'CANCELLED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: 'Criado',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparação',
  READY_FOR_PICKUP: 'Confirmado',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export const orderService = {
  // Alias for backward compatibility
  async fetchAdminOrders(filters?: any): Promise<Order[]> {
    const res = await this.fetchOrders(filters);
    return Array.isArray(res) ? res : res.items;
  },

  /**
   * GET /api/v1/orders?restaurant_id=&status=&page=&per_page=
   * Lista todos os pedidos da plataforma com filtros e paginação
   */
  async fetchOrders(
    paramsOrFilters?:
      | OrdersQueryParams
      | {
          status?: string;
          restaurant_id?: string;
          start_date?: string;
          end_date?: string;
        }
  ): Promise<{ items: Order[]; total: number } | Order[]> {
    const isParamObject = typeof paramsOrFilters === 'object';
    const rawStatus = (paramsOrFilters as any)?.status;
    const restaurantId = (paramsOrFilters as any)?.restaurant_id;
    const page = (paramsOrFilters as any)?.page || 1;
    const perPage = (paramsOrFilters as any)?.per_page || 50;

    try {
      const queryParams: Record<string, any> = { page, per_page: perPage };
      if (rawStatus && rawStatus !== 'all') {
        queryParams.status = BACKEND_STATUS_MAP[rawStatus] || rawStatus;
      }
      if (restaurantId && restaurantId !== 'all') {
        queryParams.restaurant_id = restaurantId;
      }

      let data: any = null;
      try {
        data = await api.get<any>('/orders', queryParams);
      } catch (adminErr: any) {
        if (adminErr?.status === 403 || adminErr?.status === 404) {
          data = await api.get<any>('/admin/orders', queryParams);
        } else {
          throw adminErr;
        }
      }

      const rawList = Array.isArray(data) ? data : data?.items || data?.data;
      const list = Array.isArray(rawList) ? rawList : rawList?.items || [];
      const total = data?.total || (Array.isArray(data) ? data.length : list.length);

      if (Array.isArray(list)) {
        const mapped = list.map((item) => this.normalizeFromApi(item));
        db.saveOrders(mapped);

        if ((paramsOrFilters as any)?.page) {
          return { items: mapped, total };
        }
        return mapped;
      }
    } catch (err) {
      console.warn('API /orders inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return (paramsOrFilters as any)?.page ? { items: [], total: 0 } : [];
    }

    const all = db.getOrders();
    const filtered = all.filter((o) => {
      if (rawStatus && rawStatus !== 'all' && o.status !== rawStatus && BACKEND_STATUS_MAP[o.status] !== rawStatus) {
        return false;
      }
      if (restaurantId && restaurantId !== 'all' && o.restaurantId !== restaurantId) {
        return false;
      }
      return true;
    });

    if ((paramsOrFilters as any)?.page) {
      const start = (page - 1) * perPage;
      return { items: filtered.slice(start, start + perPage), total: filtered.length };
    }
    return filtered;
  },

  /**
   * GET /api/v1/orders/{order_id}
   * Retorna os detalhes completos do pedido
   */
  async fetchOrderById(id: string): Promise<Order | undefined> {
    try {
      const data = await api.get<any>(`/orders/${id}`);
      const payload = data?.data || data;
      if (payload && (payload.id || payload.code)) {
        return this.normalizeFromApi(payload);
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn(`Erro ao carregar pedido ${id} da API:`, err);
        return undefined;
      }
    }

    return this.getById(id);
  },

  /**
   * PATCH /api/v1/orders/{order_id}/status
   * Body: { status: OrderStatus, notes?: string }
   */
  async updateStatusApi(
    id: string,
    newStatus: OrderStatus | BackendOrderStatus,
    admin: AdminUser,
    notes?: string
  ): Promise<Order | undefined> {
    const backendStatus = BACKEND_STATUS_MAP[newStatus] || (newStatus as BackendOrderStatus);

    try {
      await api.patch(`/orders/${id}/status`, {
        status: backendStatus,
        notes: notes || undefined,
      });
    } catch (err) {
      console.warn('Erro ao atualizar status via PATCH /orders/{id}/status, aplicando fallback:', err);
    }

    const legacyStatus = LEGACY_STATUS_MAP[backendStatus] || (newStatus as OrderStatus);
    return this.updateStatus(id, legacyStatus, admin, notes);
  },

  /**
   * POST /api/v1/orders/{order_id}/cancel
   * Body: { reason: string }
   */
  async cancelOrderApi(
    id: string,
    reason: string,
    admin: AdminUser
  ): Promise<Order | undefined> {
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: reason.trim(),
      });
    } catch (err) {
      console.warn('Erro ao cancelar pedido via POST /orders/{id}/cancel, aplicando fallback:', err);
    }

    return this.cancelOrder(id, reason, admin);
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
    const rawStatus = item.status || 'PENDING';
    const legacyStatus = LEGACY_STATUS_MAP[rawStatus] || rawStatus;

    let deliveryAddressStr = '';
    if (typeof item.delivery_address === 'string') {
      deliveryAddressStr = item.delivery_address;
    } else if (item.delivery_address && typeof item.delivery_address === 'object') {
      const a = item.delivery_address;
      deliveryAddressStr = `${a.street || ''}, ${a.number || 'S/N'} - ${a.neighborhood || ''}, ${a.city || ''} - ${a.state || ''}`;
    }

    return {
      id: String(item.id),
      code: item.public_code || item.code || `#OBA-${String(item.id).slice(-4)}`,
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
      subtotal: Number(item.subtotal ?? item.total_amount ?? 0),
      deliveryFee: Number(item.delivery_fee ?? item.deliveryFee ?? 5.0),
      serviceFee: Number(item.service_fee ?? item.serviceFee ?? 2.0),
      discount: Number(item.discount ?? 0),
      totalAmount: Number(item.total_amount ?? item.totalAmount ?? 0),
      paymentMethod: item.payment_method || item.paymentMethod || 'Pix',
      status: legacyStatus,
      deliveryType: item.delivery_type || item.deliveryType || 'Entrega',
      deliveryAddress: deliveryAddressStr || item.deliveryAddress || 'Rua das Flores, 123 - Centro',
      city: item.city || (typeof item.delivery_address === 'object' ? item.delivery_address?.city : 'São Paulo'),
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      estimatedDeliveryTime: item.estimated_delivery_time || item.estimatedDeliveryTime,
      statusHistory: Array.isArray(item.status_history)
        ? item.status_history.map((sh: any) => ({
            status: LEGACY_STATUS_MAP[sh.status] || sh.status,
            timestamp: sh.timestamp || sh.created_at || new Date().toISOString(),
            note: sh.notes || sh.reason,
            adminName: sh.admin_name || sh.changed_by_email,
          }))
        : Array.isArray(item.statusHistory)
        ? item.statusHistory
        : [],
      occurrences: Array.isArray(item.occurrences) ? item.occurrences : [],
    };
  },
};

export default orderService;
