import { db } from '../storage/db';
import type { FinancialRecord, PayoutStatus, AdminUser } from '../types';

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
      adminRole: admin.role,
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
      adminRole: admin.role,
      action: 'Processamento em lote de repasses',
      module: 'Financeiro',
      entityId: restaurantId || 'global',
      details: `Lote de ${count} lançamentos financeiros transferidos de Pendente para Processado`,
    });

    return count;
  },
};
