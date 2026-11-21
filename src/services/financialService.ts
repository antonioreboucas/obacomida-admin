import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { FinancialRecord, PayoutStatus, AdminUser, FinancialCommission, FinancialTransaction } from '../types';
import type {
  CommissionPolicy,
  CreateCommissionRequest,
  LedgerTransaction,
  FinancialTransactionsQueryParams,
} from '../types/api';

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
   * GET /api/v1/admin/commissions
   * Lista todas as políticas de comissões cadastradas
   */
  async fetchCommissionPolicies(): Promise<CommissionPolicy[]> {
    try {
      const data = await api.get<any>('/admin/commissions');
      const list = Array.isArray(data) ? data : data?.items || data?.data;
      if (Array.isArray(list)) {
        return list.map((item) => ({
          id: item.id || `pol-${Date.now()}`,
          restaurant_id: item.restaurant_id ?? null,
          restaurant_name: item.restaurant_name,
          percentage: Number(item.percentage ?? 12.5),
          fixed_fee: Number(item.fixed_fee ?? 0),
          service_fee: Number(item.service_fee ?? 2.0),
          created_at: item.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('API /admin/commissions inacessível:', err);
    }

    // Default fallback
    const settings = db.getSettings();
    return [
      {
        id: 'global-default',
        restaurant_id: null,
        restaurant_name: 'Padrão da Plataforma (Global)',
        percentage: settings.defaultCommissionRate || 12.5,
        fixed_fee: settings.defaultFixedFee || 0.0,
        service_fee: settings.defaultServiceFeeRate || 2.0,
        created_at: new Date().toISOString(),
      },
    ];
  },

  /**
   * POST /api/v1/admin/commissions
   * Cadastra nova regra de comissão (global ou para restaurante específico)
   */
  async createCommissionPolicy(
    payload: CreateCommissionRequest,
    admin: AdminUser
  ): Promise<CommissionPolicy> {
    try {
      const res = await api.post<any>('/admin/commissions', payload);
      const data = res?.data || res;
      if (data) {
        db.logAudit({
          adminId: admin.id,
          adminName: admin.name,
          adminRole: String(admin.role),
          action: 'Criação de política de comissão',
          module: 'Financeiro',
          entityId: data.id || 'commission-policy',
          details: `Política de comissão criada: ${payload.percentage}% + R$ ${payload.fixed_fee} fixo + R$ ${payload.service_fee} taxa`,
        });
        return data;
      }
    } catch (err) {
      console.warn('Erro ao salvar comissão via API, usando fallback:', err);
    }

    const created: CommissionPolicy = {
      id: `comm-${Date.now()}`,
      restaurant_id: payload.restaurant_id,
      percentage: payload.percentage,
      fixed_fee: payload.fixed_fee,
      service_fee: payload.service_fee,
      created_at: new Date().toISOString(),
    };

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Criação de política de comissão (local)',
      module: 'Financeiro',
      entityId: created.id!,
      details: `Política criada: ${payload.percentage}% para ${payload.restaurant_id || 'Global'}`,
    });

    return created;
  },

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
   * Extrato do Ledger financeiro (order_id, gross_sales, platform_commission, service_fee, etc.)
   */
  async fetchTransactions(
    params?: FinancialTransactionsQueryParams
  ): Promise<any> {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.restaurant_id && params.restaurant_id !== 'all') queryParams.restaurant_id = params.restaurant_id;
      if (params?.status && params.status !== 'all') queryParams.status = params.status;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;
      if (params?.page) queryParams.page = params.page;
      if (params?.per_page) queryParams.per_page = params.per_page;

      const data = await api.get<any>('/financial/transactions', queryParams);
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        const mapped: LedgerTransaction[] = list.map((t) => ({
          id: String(t.id),
          order_id: t.order_id || t.orderId || `ord-${Math.random()}`,
          order_code: t.order_code || t.orderCode,
          restaurant_id: t.restaurant_id || t.restaurantId || 'rest-1',
          restaurant_name: t.restaurant_name || t.restaurantName || 'Restaurante',
          gross_sales: Number(t.gross_sales ?? t.grossAmount ?? t.amount ?? 0),
          platform_commission: Number(t.platform_commission ?? t.commissionAmount ?? 0),
          service_fee: Number(t.service_fee ?? t.serviceFee ?? 2.0),
          delivery_fee: Number(t.delivery_fee ?? t.deliveryFee ?? 0),
          discounts: Number(t.discounts ?? 0),
          refunds: Number(t.refunds ?? 0),
          restaurant_net_amount: Number(t.restaurant_net_amount ?? t.netAmount ?? 0),
          status: t.status || 'SETTLED',
          created_at: t.created_at || t.createdAt || new Date().toISOString(),
          settled_at: t.settled_at || t.payoutDate,
        }));

        if (params?.page || params?.per_page) {
          return { items: mapped, total: data?.total || mapped.length };
        }
        return mapped;
      }
      if (!isMockEnabled()) {
        return params?.page ? { items: [], total: 0 } : [];
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn('Erro ao carregar transações da API central:', err);
        return params?.page ? { items: [], total: 0 } : [];
      }
    }

    const orders = db.getOrders();
    const fallbackLedger: LedgerTransaction[] = orders.slice(0, 30).map((o) => {
      const gross = o.totalAmount;
      const comm = Number(((gross * 12) / 100).toFixed(2));
      const sFee = o.serviceFee || 2.0;
      return {
        id: `tx-${o.id}`,
        order_id: o.id,
        order_code: o.code,
        restaurant_id: o.restaurantId,
        restaurant_name: o.restaurantName,
        gross_sales: gross,
        platform_commission: comm,
        service_fee: sFee,
        delivery_fee: o.deliveryFee,
        discounts: o.discount,
        refunds: 0,
        restaurant_net_amount: Number((gross - comm - sFee).toFixed(2)),
        status: o.status === 'Cancelado' ? 'CANCELLED' : 'SETTLED',
        created_at: o.createdAt,
      };
    });

    if (params?.page || params?.per_page) {
      return { items: fallbackLedger, total: fallbackLedger.length };
    }
    return fallbackLedger;
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

  normalizeCommission(item: any): FinancialCommission {
    return {
      id: String(item.id),
      restaurant_id: item.restaurant_id || item.restaurantId,
      restaurant_name: item.restaurant_name || item.restaurantName || 'Restaurante',
      order_id: item.order_id || item.orderId,
      order_code: item.order_code || item.orderCode || '#OBA-0000',
      order_amount: Number(item.order_amount ?? item.orderAmount ?? item.gross_sales ?? 0),
      commission_rate: Number(item.commission_rate ?? item.commissionRate ?? 12.0),
      commission_amount: Number(item.commission_amount ?? item.commissionAmount ?? item.platform_commission ?? 0),
      net_amount: Number(item.net_amount ?? item.netAmount ?? item.restaurant_net_amount ?? 0),
      is_settled: item.is_settled ?? item.isSettled ?? false,
      settled_at: item.settled_at || item.settledAt,
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
    };
  },
};

export default financialService;
