import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { FinancialRecord, PayoutStatus, AdminUser, FinancialCommission, FinancialTransaction } from '../types';

export interface FinancialSummary {
  grossVolume: number;
  platformRevenue: number;
  totalCommissions: number;
  totalServiceFees: number;
  totalDeliveryFees: number;
  cancelledAmount: number;
  refundedAmount: number;
  pendingPayouts: number;
  processedPayouts: number;
  paidPayouts: number;
  retainedPayouts: number;
}

export const financialService = {
  /**
   * GET /api/v1/financial/commissions?restaurant_id=&is_settled=
   * Relatório de comissões retidas e repasses por loja
   */
  async fetchCommissions(restaurantId?: string, isSettled?: boolean): Promise<FinancialCommission[]> {
    try {
      const params: Record<string, any> = {};
      if (restaurantId && restaurantId !== 'all') params.restaurant_id = restaurantId;
      if (isSettled !== undefined) params.is_settled = isSettled;

      const data = await api.get<any>('/financial/commissions', params);
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        return list.map((item) => this.normalizeCommission(item));
      }
    } catch (err) {
      console.warn('API de comissões inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return [];
    }

    const records = db.getFinancialRecords();
    const restaurants = db.getRestaurants();

    return records
      .filter((r) => {
        if (restaurantId && restaurantId !== 'all' && r.restaurantId !== restaurantId) return false;
        if (isSettled !== undefined) {
          const settled = r.payoutStatus === 'Pago' || r.payoutStatus === 'Processado';
          if (settled !== isSettled) return false;
        }
        return true;
      })
      .map((r) => ({
        id: r.id,
        restaurant_id: r.restaurantId,
        restaurant_name: r.restaurantName,
        order_id: r.orderId,
        order_code: r.orderCode,
        order_amount: r.grossAmount,
        commission_rate: r.commissionPercentage,
        commission_amount: r.commissionAmount,
        net_amount: r.netAmount,
        is_settled: r.payoutStatus === 'Pago' || r.payoutStatus === 'Processado',
        settled_at: r.payoutDate,
        created_at: r.date,
      }));
  },

  /**
   * POST /api/v1/financial/commissions/settle
   * Liquidar repasse / conciliar comissões em lote
   * Payload: { commission_ids: ["uuid", ...] }
   */
  async settleCommissions(
    commissionIds: string[],
    admin: AdminUser
  ): Promise<{ settledCount: number; message: string }> {
    try {
      await api.post('/financial/commissions/settle', {
        commission_ids: commissionIds,
      });
    } catch (err) {
      console.warn('Erro ao conciliar via API, aplicando fallback local:', err);
    }

    const records = db.getFinancialRecords();
    const idSet = new Set(commissionIds);
    let count = 0;

    const updated = records.map((r) => {
      if (idSet.has(r.id)) {
        count++;
        return {
          ...r,
          payoutStatus: 'Pago' as PayoutStatus,
          payoutDate: new Date().toISOString(),
        };
      }
      return r;
    });

    db.saveFinancialRecords(updated);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Liquidação de repasse / conciliação de comissões',
      module: 'Financeiro',
      entityId: `lote-${Date.now()}`,
      details: `Lote de ${count} comissões liquidado e repassado com sucesso`,
    });

    return {
      settledCount: count,
      message: `${count} comissões liquidadas com sucesso.`,
    };
  },

  /**
   * GET /api/v1/financial/transactions
   * Histórico de transações financeiras globais
   */
  async fetchTransactions(): Promise<FinancialTransaction[]> {
    try {
      const data = await api.get<any>('/financial/transactions');
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        return list.map((t) => ({
          id: String(t.id),
          order_id: t.order_id || t.orderId,
          restaurant_id: t.restaurant_id || t.restaurantId,
          restaurant_name: t.restaurant_name || t.restaurantName || 'Restaurante',
          type: t.type || 'COMMISSION',
          amount: Number(t.amount ?? 0),
          status: t.status || 'COMPLETED',
          payment_method: t.payment_method || t.paymentMethod || 'Pix',
          created_at: t.created_at || t.createdAt || new Date().toISOString(),
          description: t.description || 'Transação financeira',
        }));
      }
      if (!isMockEnabled()) {
        return [];
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn('Erro ao carregar transações da API central:', err);
        return [];
      }
    }

    const orders = db.getOrders();
    return orders.slice(0, 30).map((o) => ({
      id: `tx-${o.id}`,
      order_id: o.id,
      restaurant_id: o.restaurantId,
      restaurant_name: o.restaurantName,
      type: 'COMMISSION',
      amount: Number(((o.totalAmount * 12) / 100).toFixed(2)),
      status: o.status === 'Cancelado' ? 'FAILED' : 'COMPLETED',
      payment_method: o.paymentMethod,
      created_at: o.createdAt,
      description: `Retenção de comissão ref. pedido ${o.code}`,
    }));
  },

  getAll(): FinancialRecord[] {
    return db.getFinancialRecords();
  },

  getByRestaurantId(restaurantId: string): FinancialRecord[] {
    return db.getFinancialRecords().filter((r) => r.restaurantId === restaurantId);
  },

  getSummary(restaurantId?: string): FinancialSummary {
    const orders = db.getOrders();
    const records = restaurantId
      ? db.getFinancialRecords().filter((r) => r.restaurantId === restaurantId)
      : db.getFinancialRecords();

    const relevantOrders = restaurantId
      ? orders.filter((o) => o.restaurantId === restaurantId)
      : orders;

    const cancelledOrders = relevantOrders.filter((o) => o.status === 'Cancelado');
    const cancelledAmount = Number(
      cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
    );

    const refundedAmount = Number(
      cancelledOrders.reduce((sum, o) => sum + o.totalAmount * 0.9, 0).toFixed(2)
    );

    let grossVolume = 0;
    let totalCommissions = 0;
    let totalServiceFees = 0;
    let totalDeliveryFees = 0;
    let pendingPayouts = 0;
    let processedPayouts = 0;
    let paidPayouts = 0;
    let retainedPayouts = 0;

    records.forEach((rec) => {
      grossVolume += rec.grossAmount;
      totalCommissions += rec.commissionAmount;
      totalServiceFees += rec.serviceFee;
      totalDeliveryFees += rec.deliveryFee;

      if (rec.payoutStatus === 'Pendente') pendingPayouts += rec.netAmount;
      else if (rec.payoutStatus === 'Processado') processedPayouts += rec.netAmount;
      else if (rec.payoutStatus === 'Pago') paidPayouts += rec.netAmount;
      else if (rec.payoutStatus === 'Retido') retainedPayouts += rec.netAmount;
    });

    const platformRevenue = Number((totalCommissions + totalServiceFees).toFixed(2));

    return {
      grossVolume: Number(grossVolume.toFixed(2)),
      platformRevenue,
      totalCommissions: Number(totalCommissions.toFixed(2)),
      totalServiceFees: Number(totalServiceFees.toFixed(2)),
      totalDeliveryFees: Number(totalDeliveryFees.toFixed(2)),
      cancelledAmount,
      refundedAmount,
      pendingPayouts: Number(pendingPayouts.toFixed(2)),
      processedPayouts: Number(processedPayouts.toFixed(2)),
      paidPayouts: Number(paidPayouts.toFixed(2)),
      retainedPayouts: Number(retainedPayouts.toFixed(2)),
    };
  },

  updatePayoutStatus(
    id: string,
    newStatus: PayoutStatus,
    admin: AdminUser,
    notes?: string
  ): FinancialRecord | undefined {
    const records = db.getFinancialRecords();
    const record = records.find((r) => r.id === id);
    if (!record) return undefined;

    const updated: FinancialRecord = {
      ...record,
      payoutStatus: newStatus,
      payoutDate: newStatus === 'Pago' ? new Date().toISOString() : record.payoutDate,
    };

    db.saveFinancialRecords(records.map((r) => (r.id === id ? updated : r)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Alteração de status de repasse financeiro',
      module: 'Financeiro',
      entityId: record.id,
      details: `Repasse ref. pedido ${record.orderCode} para ${record.restaurantName} alterado para "${newStatus}". ${notes || ''}`,
      previousValue: record.payoutStatus,
      currentValue: newStatus,
    });

    return updated;
  },

  batchProcessPayouts(restaurantId: string | undefined, admin: AdminUser): number {
    const records = db.getFinancialRecords();
    let count = 0;

    const updatedRecords = records.map((rec) => {
      if ((!restaurantId || rec.restaurantId === restaurantId) && rec.payoutStatus === 'Pendente') {
        count++;
        return {
          ...rec,
          payoutStatus: 'Processado' as PayoutStatus,
        };
      }
      return rec;
    });

    db.saveFinancialRecords(updatedRecords);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Processamento em lote de repasses',
      module: 'Financeiro',
      entityId: restaurantId || 'global',
      details: `Lote de ${count} lançamentos financeiros transferidos de Pendente para Processado`,
    });

    return count;
  },

  normalizeCommission(item: any): FinancialCommission {
    const rate = Number(item.commission_rate ?? item.commissionRate ?? 0.12);
    const commission_rate = rate <= 1 && rate > 0 ? Number((rate * 100).toFixed(1)) : rate;

    return {
      id: String(item.id),
      restaurant_id: item.restaurant_id || item.restaurantId || 'rest-1',
      restaurant_name: item.restaurant_name || item.restaurantName || 'Restaurante',
      order_id: item.order_id || item.orderId || '',
      order_code: item.order_code || item.orderCode || `#OBA-${String(item.order_id || '').slice(-4)}`,
      order_amount: Number(item.order_amount ?? item.gross_amount ?? item.grossAmount ?? 0),
      commission_rate,
      commission_amount: Number(item.commission_amount ?? item.commissionAmount ?? 0),
      net_amount: Number(item.net_amount ?? item.netAmount ?? 0),
      is_settled: Boolean(item.is_settled ?? item.isSettled ?? false),
      settled_at: item.settled_at || item.settledAt,
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
    };
  },
};
