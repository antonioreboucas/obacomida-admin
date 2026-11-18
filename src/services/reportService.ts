import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Order, AdminOverviewKPIs, SalesByCategoryItem, TopRestaurantItem } from '../types';

export interface ReportFilter {
  period: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate?: string;
  endDate?: string;
  city?: string;
  restaurantId?: string;
}

export interface ReportData {
  totalOrders: number;
  grossRevenue: number;
  platformRevenue: number;
  totalCommissions: number;
  averageTicket: number;
  cancellationRate: number;
  activeRestaurantsCount: number;
  ordersByDay: { date: string; orders: number; revenue: number }[];
  ordersByStatus: { status: string; count: number; percentage: number }[];
  ordersByCategory: { category: string; count: number; revenue: number }[];
  topRestaurants: { id: string; name: string; orders: number; revenue: number }[];
  topCustomers: { id: string; name: string; orders: number; totalSpent: number }[];
  topProducts: { id: string; name: string; restaurantName: string; quantity: number; revenue: number }[];
}

export const reportService = {
  /**
   * GET /api/v1/admin/dashboard ou GET /api/v1/reports/admin/overview
   * Retorna os KPIs globais principais da plataforma
   */
  async getOverviewKPIs(): Promise<AdminOverviewKPIs> {
    try {
      let data: any = null;
      try {
        data = await api.get<any>('/admin/dashboard');
      } catch {
        data = await api.get<any>('/reports/admin/overview');
      }

      if (data) {
        const payload = (data && data.data !== undefined) ? data.data : data;
        const totalGmv = Number(
          payload.total_sales ?? payload.total_gmv ?? payload.gross_revenue ?? payload.grossRevenue ?? 0
        );
        const platformRevenue = Number(
          payload.platform_revenue ?? payload.platformRevenue ?? payload.total_commissions ?? 0
        );
        const totalOrders = Number(
          payload.total_orders_count ?? payload.total_orders ?? payload.totalOrders ?? 0
        );
        const activeRestaurants = Number(
          payload.active_restaurants_count ?? payload.active_restaurants ?? payload.activeRestaurants ?? 0
        );
        const totalCustomers = Number(
          payload.total_customers ?? payload.totalCustomers ?? 0
        );
        const averageTicket = Number(
          payload.average_ticket ?? (totalOrders > 0 ? totalGmv / totalOrders : 0)
        );

        return {
          total_gmv: totalGmv,
          platform_revenue: platformRevenue,
          total_orders: totalOrders,
          active_restaurants: activeRestaurants,
          total_customers: totalCustomers,
          average_ticket: Number(averageTicket.toFixed(2)),
        };
      }
    } catch {
      if (!isMockEnabled()) {
        return {
          total_gmv: 0,
          platform_revenue: 0,
          total_orders: 0,
          active_restaurants: 0,
          total_customers: 0,
          average_ticket: 0,
        };
      }
      // Offline fallback computation
      const restaurants = db.getRestaurants();
      const customers = db.getCustomers();
      const orders = db.getOrders();
      const completed = orders.filter((o) => o.status === 'Entregue');
      const gmv = completed.reduce((sum, o) => sum + o.totalAmount, 0);
      const platformRevenue = completed.reduce((sum, o) => {
        const r = restaurants.find((rest) => rest.id === o.restaurantId);
        const rate = r ? r.commissionRate : 12;
        return sum + (o.totalAmount * rate) / 100 + o.serviceFee;
      }, 0);
      const avgTicket = completed.length > 0 ? gmv / completed.length : 0;

      return {
        total_gmv: Number(gmv.toFixed(2)),
        platform_revenue: Number(platformRevenue.toFixed(2)),
        total_orders: orders.length,
        active_restaurants: restaurants.filter((r) => r.status === 'Ativo').length,
        total_customers: customers.length,
        average_ticket: Number(avgTicket.toFixed(2)),
      };
    }

    return {
      total_gmv: 0,
      platform_revenue: 0,
      total_orders: 0,
      active_restaurants: 0,
      total_customers: 0,
      average_ticket: 0,
    };
  },

  /**
   * GET /api/v1/reports/admin/sales-by-category
   * Retorna as vendas agregadas por categoria global
   */
  async getSalesByCategory(): Promise<SalesByCategoryItem[]> {
    try {
      const data = await api.get<any>('/reports/admin/sales-by-category');
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        return list.map((item) => ({
          category: item.category || item.category_name || item.name || 'Outros',
          revenue: Number(item.revenue ?? item.total_sales ?? item.total_amount ?? 0),
          count: Number(item.count ?? item.orders_count ?? item.orders ?? 0),
          percentage: item.percentage ? Number(item.percentage) : undefined,
        }));
      }
      if (!isMockEnabled()) {
        return [];
      }
    } catch {
      if (!isMockEnabled()) {
        return [];
      }
    }

    const report = this.generateReport({ period: '30days' });
    return report.ordersByCategory.map((c) => ({
      category: c.category,
      revenue: c.revenue,
      count: c.count,
    }));
  },

  /**
   * GET /api/v1/reports/admin/top-restaurants
   * Retorna o ranking de estabelecimentos com maior faturamento
   */
  async getTopRestaurants(): Promise<TopRestaurantItem[]> {
    try {
      const data = await api.get<any>('/reports/admin/top-restaurants');
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        return list.map((item) => ({
          id: item.id || item.restaurant_id || `rest-${Math.random()}`,
          name: item.name || item.restaurant_name || 'Restaurante',
          orders: Number(item.orders ?? item.total_orders ?? 0),
          revenue: Number(item.revenue ?? item.total_revenue ?? 0),
        }));
      }
      if (!isMockEnabled()) {
        return [];
      }
    } catch {
      if (!isMockEnabled()) {
        return [];
      }
    }

    const report = this.generateReport({ period: '30days' });
    return report.topRestaurants;
  },
  filterOrders(filter: ReportFilter): Order[] {
    const orders = db.getOrders();
    const now = new Date(2026, 10, 16, 23, 59, 59);

    let start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let end = now;

    if (filter.period === 'today') {
      start = new Date(2026, 10, 16, 0, 0, 0);
      end = new Date(2026, 10, 16, 23, 59, 59);
    } else if (filter.period === 'yesterday') {
      start = new Date(2026, 10, 15, 0, 0, 0);
      end = new Date(2026, 10, 15, 23, 59, 59);
    } else if (filter.period === '7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter.period === '30days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter.period === 'thisMonth') {
      start = new Date(2026, 10, 1, 0, 0, 0);
    } else if (filter.period === 'lastMonth') {
      start = new Date(2026, 9, 1, 0, 0, 0);
      end = new Date(2026, 9, 31, 23, 59, 59);
    } else if (filter.period === 'custom' && filter.startDate && filter.endDate) {
      start = new Date(filter.startDate);
      end = new Date(filter.endDate);
    }

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (orderDate < start || orderDate > end) return false;
      if (filter.city && o.city !== filter.city) return false;
      if (filter.restaurantId && o.restaurantId !== filter.restaurantId) return false;
      return true;
    });
  },

  generateReport(filter: ReportFilter): ReportData {
    const filteredOrders = this.filterOrders(filter);
    const restaurants = db.getRestaurants();
    const categories = db.getCategories();

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status === 'Entregue');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'Cancelado');

    const grossRevenue = Number(
      completedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
    );
    const totalCommissions = Number(
      completedOrders.reduce((sum, o) => {
        const rest = restaurants.find((r) => r.id === o.restaurantId);
        const rate = rest ? rest.commissionRate : 12;
        return sum + (o.totalAmount * rate) / 100;
      }, 0).toFixed(2)
    );
    const totalServiceFees = Number(
      completedOrders.reduce((sum, o) => sum + o.serviceFee, 0).toFixed(2)
    );
    const platformRevenue = Number((totalCommissions + totalServiceFees).toFixed(2));

    const averageTicket = completedOrders.length > 0
      ? Number((grossRevenue / completedOrders.length).toFixed(2))
      : 0;

    const cancellationRate = totalOrders > 0
      ? Number(((cancelledOrders.length / totalOrders) * 100).toFixed(1))
      : 0;

    // Orders by day
    const dayMap = new Map<string, { orders: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      const day = o.createdAt.split('T')[0];
      const prev = dayMap.get(day) || { orders: 0, revenue: 0 };
      dayMap.set(day, {
        orders: prev.orders + 1,
        revenue: o.status === 'Entregue' ? Number((prev.revenue + o.totalAmount).toFixed(2)) : prev.revenue,
      });
    });

    const ordersByDay = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // Orders by status
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(1)) : 0,
    }));

    // Top restaurants
    const restSalesMap = new Map<string, { name: string; orders: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      const prev = restSalesMap.get(o.restaurantId) || { name: o.restaurantName, orders: 0, revenue: 0 };
      restSalesMap.set(o.restaurantId, {
        name: o.restaurantName,
        orders: prev.orders + 1,
        revenue: o.status === 'Entregue' ? Number((prev.revenue + o.totalAmount).toFixed(2)) : prev.revenue,
      });
    });

    const topRestaurants = Array.from(restSalesMap.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Orders by category
    const catSalesMap = new Map<string, { count: number; revenue: number }>();
    categories.forEach((c) => catSalesMap.set(c.name, { count: 0, revenue: 0 }));

    filteredOrders.forEach((o) => {
      const rest = restaurants.find((r) => r.id === o.restaurantId);
      const catName = rest?.category || 'Outros';
      const prev = catSalesMap.get(catName) || { count: 0, revenue: 0 };
      catSalesMap.set(catName, {
        count: prev.count + 1,
        revenue: o.status === 'Entregue' ? Number((prev.revenue + o.totalAmount).toFixed(2)) : prev.revenue,
      });
    });

    const ordersByCategory = Array.from(catSalesMap.entries())
      .filter(([_, val]) => val.count > 0)
      .map(([category, val]) => ({ category, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top customers
    const custMap = new Map<string, { name: string; orders: number; totalSpent: number }>();
    filteredOrders.forEach((o) => {
      const prev = custMap.get(o.customerId) || { name: o.customerName, orders: 0, totalSpent: 0 };
      custMap.set(o.customerId, {
        name: o.customerName,
        orders: prev.orders + 1,
        totalSpent: o.status === 'Entregue' ? Number((prev.totalSpent + o.totalAmount).toFixed(2)) : prev.totalSpent,
      });
    });

    const topCustomers = Array.from(custMap.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    // Top products
    const prodMap = new Map<string, { name: string; restaurantName: string; quantity: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      if (o.status === 'Entregue') {
        o.items.forEach((item) => {
          const prev = prodMap.get(item.productId) || {
            name: item.productName,
            restaurantName: o.restaurantName,
            quantity: 0,
            revenue: 0,
          };
          prodMap.set(item.productId, {
            name: item.productName,
            restaurantName: o.restaurantName,
            quantity: prev.quantity + item.quantity,
            revenue: Number((prev.revenue + item.totalPrice).toFixed(2)),
          });
        });
      }
    });

    const topProducts = Array.from(prodMap.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalOrders,
      grossRevenue,
      platformRevenue,
      totalCommissions,
      averageTicket,
      cancellationRate,
      activeRestaurantsCount: restaurants.filter((r) => r.status === 'Ativo').length,
      ordersByDay,
      ordersByStatus,
      ordersByCategory,
      topRestaurants,
      topCustomers,
      topProducts,
    };
  },

  exportToCsv(report: ReportData, filename = 'relatorio_oba_comida.csv'): void {
    const lines = [
      'Relatório Operacional e Financeiro - Oba Comida',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      '--- INDICADORES GERAIS ---',
      `Pedidos Totais,${report.totalOrders}`,
      `Faturamento Bruto,R$ ${report.grossRevenue.toFixed(2)}`,
      `Receita da Plataforma,R$ ${report.platformRevenue.toFixed(2)}`,
      `Comissões Estimadas,R$ ${report.totalCommissions.toFixed(2)}`,
      `Ticket Médio,R$ ${report.averageTicket.toFixed(2)}`,
      `Taxa de Cancelamento,${report.cancellationRate}%`,
      '',
      '--- TOP RESTAURANTES ---',
      'Restaurante,Pedidos,Faturamento',
      ...report.topRestaurants.map((r) => `"${r.name}",${r.orders},R$ ${r.revenue.toFixed(2)}`),
      '',
      '--- PRODUTOS MAIS VENDIDOS ---',
      'Produto,Restaurante,Quantidade,Faturamento',
      ...report.topProducts.map((p) => `"${p.name}","${p.restaurantName}",${p.quantity},R$ ${p.revenue.toFixed(2)}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
