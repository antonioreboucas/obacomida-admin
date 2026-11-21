import { api } from './api';
import type { AdminDashboardMetrics, AdminReportData } from '../types/api';
import { db } from '../storage/db';

export const dashboardService = {
  /**
   * GET /api/v1/admin/dashboard
   * KPIs principais em tempo real da plataforma
   */
  async getMetrics(): Promise<AdminDashboardMetrics> {
    try {
      const data = await api.get<any>('/admin/dashboard');
      const payload = data?.data || data;

      if (payload) {
        const totalSales = Number(payload.total_sales ?? payload.total_gmv ?? 0);
        const totalOrders = Number(payload.total_orders_count ?? payload.total_orders ?? 0);
        const avgTicket = Number(
          payload.average_ticket ?? (totalOrders > 0 ? totalSales / totalOrders : 0)
        );

        return {
          total_sales: totalSales,
          platform_revenue: Number(payload.platform_revenue ?? payload.total_commissions ?? 0),
          total_orders_count: totalOrders,
          active_restaurants_count: Number(payload.active_restaurants_count ?? payload.active_restaurants ?? 0),
          registered_customers_count: Number(payload.registered_customers_count ?? payload.total_customers ?? 0),
          total_partners_count: Number(payload.total_partners_count ?? payload.total_partners ?? 0),
          average_ticket: Number(avgTicket.toFixed(2)),
        };
      }
    } catch (err) {
      console.warn('API /admin/dashboard inacessível, gerando métricas a partir da base local:', err);
    }

    // Fallback local calculation
    const restaurants = db.getRestaurants();
    const customers = db.getCustomers();
    const orders = db.getOrders();
    const completed = orders.filter((o) => o.status === 'Entregue' || (o.status as any) === 'DELIVERED');
    const totalSales = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const platformRev = completed.reduce((sum, o) => {
      const r = restaurants.find((rest) => rest.id === o.restaurantId);
      const rate = r?.commissionRate ? r.commissionRate / 100 : 0.12;
      return sum + (o.totalAmount || 0) * rate + (o.serviceFee || 2.0);
    }, 0);
    const avgTicket = completed.length > 0 ? totalSales / completed.length : 0;

    return {
      total_sales: Number(totalSales.toFixed(2)),
      platform_revenue: Number(platformRev.toFixed(2)),
      total_orders_count: orders.length,
      active_restaurants_count: restaurants.filter((r) => r.status === 'Ativo' || r.status === 'ACTIVE').length,
      registered_customers_count: customers.length,
      total_partners_count: restaurants.length,
      average_ticket: Number(avgTicket.toFixed(2)),
    };
  },

  /**
   * GET /api/v1/reports/admin
   * Relatório executivo consolidado da plataforma
   */
  async getAdminReport(startDate?: string, endDate?: string): Promise<AdminReportData> {
    try {
      const params: Record<string, any> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await api.get<any>('/reports/admin', params);
      const payload = data?.data || data;
      if (payload) {
        return payload;
      }
    } catch (err) {
      console.warn('API /reports/admin inacessível, fallback executado:', err);
    }

    const metrics = await this.getMetrics();
    return {
      metrics,
      revenue_by_date: [],
      sales_by_category: [],
      top_restaurants: [],
    };
  },
};

export default dashboardService;
