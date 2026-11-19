import React, { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Users,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Calendar,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { reportService, type ReportFilter } from '../services/reportService';
import { isMockEnabled } from '../services/api';
import { db } from '../storage/db';
import type { AdminOverviewKPIs } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: any, itemId?: string) => void;
}

const COLORS = ['#ff6600', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [filterPeriod, setFilterPeriod] = useState<ReportFilter['period']>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  // Live API State (GET /admin/dashboard ou GET /reports/admin/overview)
  const [apiOverview, setApiOverview] = useState<AdminOverviewKPIs | null>(null);

  const [categorySales, setCategorySales] = useState<{ category: string; count: number; revenue: number }[]>([]);
  const [topRestaurantsApi, setTopRestaurantsApi] = useState<{ id: string; name: string; orders: number; revenue: number }[]>([]);

  // Fetch report data dynamically from mock as fallback/baseline
  const reportData = useMemo(() => {
    return reportService.generateReport({
      period: filterPeriod,
      startDate: customStart,
      endDate: customEnd,
    });
  }, [filterPeriod, customStart, customEnd]);

  useEffect(() => {
    let mounted = true;
    const loadApiData = async () => {
      setIsLoadingApi(true);
      try {
        const [overview, catSales, topRest] = await Promise.all([
          reportService.getOverviewKPIs(),
          reportService.getSalesByCategory(),
          reportService.getTopRestaurants(),
        ]);
        if (mounted) {
          setApiOverview(overview);
          setCategorySales(catSales);
          setTopRestaurantsApi(topRest);
        }
      } catch (err) {
        console.warn('Falha ao carregar métricas da API:', err);
      } finally {
        if (mounted) setIsLoadingApi(false);
      }
    };

    loadApiData();
    return () => {
      mounted = false;
    };
  }, [filterPeriod, customStart, customEnd]);

  const isMock = isMockEnabled();
  const restaurants = db.getRestaurants();
  const customers = db.getCustomers();
  const orders = db.getOrders();

  const totalRestaurants = restaurants.length;
  const activeRestaurants = apiOverview?.active_restaurants ?? (isMock ? restaurants.filter((r) => r.status === 'Ativo').length : totalRestaurants);
  const pendingRestaurants = restaurants.filter(
    (r) => r.status === 'Pendente' || r.status === 'Em análise' || r.status === 'PENDING'
  ).length;

  const totalCustomers = apiOverview?.total_customers ?? (isMock ? customers.length : 0);
  const totalOrders = apiOverview?.total_orders ?? (isMock ? reportData.totalOrders : orders.length);
  const totalGmv = apiOverview?.total_gmv ?? (isMock ? reportData.grossRevenue : 0);
  const platformRevenue = apiOverview?.platform_revenue ?? (isMock ? reportData.platformRevenue : 0);
  const averageTicket = apiOverview?.average_ticket ?? (isMock ? reportData.averageTicket : (totalOrders > 0 ? totalGmv / totalOrders : 0));

  const activeOrdersCount = orders.filter((o) =>
    ['Criado', 'Confirmado', 'Em preparação', 'Saiu para entrega', 'PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)
  ).length;

  const displayedOrdersByDay = isMock ? reportData.ordersByDay : (orders.length > 0 ? reportData.ordersByDay : []);
  const displayedCategorySales = categorySales.length > 0 ? categorySales : (isMock ? reportData.ordersByCategory : []);
  const displayedTopRestaurants = topRestaurantsApi.length > 0 ? topRestaurantsApi : (isMock ? reportData.topRestaurants : []);
  const displayedOrdersByStatus = isMock ? reportData.ordersByStatus : (orders.length > 0 ? reportData.ordersByStatus : []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Visão Geral da Plataforma
            </h1>
            <Badge variant="primary" dot>
              Tempo Real
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indicadores executivos e métricas operacionais consolidadas do marketplace Oba Comida.
          </p>
        </div>

        {/* Period Filter Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: '7days', label: '7 dias' },
              { id: '30days', label: '30 dias' },
              { id: 'thisMonth', label: 'Este mês' },
              { id: 'lastMonth', label: 'Mês anterior' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPeriod(p.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterPeriod === p.id
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filterPeriod === 'custom' && (
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid - GET /api/v1/reports/admin/overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total GMV (Volume Bruto)"
          value={`R$ ${(totalGmv / 1000).toFixed(1)}k`}
          subtitle={`R$ ${totalGmv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} transacionado`}
          icon={DollarSign}
          colorScheme="emerald"
          trend={{ value: 18.2, isPositive: true }}
          onClick={() => onNavigate('financial')}
        />
        <StatCard
          title="Receita da Plataforma"
          value={`R$ ${(platformRevenue / 1000).toFixed(1)}k`}
          subtitle="Comissões retidas no período"
          icon={TrendingUp}
          colorScheme="orange"
          trend={{ value: 15.4, isPositive: true }}
          onClick={() => onNavigate('financial')}
        />
        <StatCard
          title="Total de Pedidos"
          value={totalOrders.toLocaleString('pt-BR')}
          subtitle={`${activeOrdersCount} em andamento`}
          icon={ShoppingBag}
          colorScheme="purple"
          trend={{ value: 12.1, isPositive: true }}
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Restaurantes Ativos"
          value={activeRestaurants}
          subtitle={`${totalRestaurants} cadastrados • ${pendingRestaurants} pendentes`}
          icon={Store}
          colorScheme="blue"
          onClick={() => onNavigate('restaurants')}
        />
        <StatCard
          title="Clientes Cadastrados"
          value={totalCustomers.toLocaleString('pt-BR')}
          subtitle="Base total de consumidores"
          icon={Users}
          colorScheme="orange"
          onClick={() => onNavigate('customers')}
        />
      </div>

      {/* Financial KPIs Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Pedidos em Andamento"
          value={activeOrdersCount}
          subtitle="Em preparo ou entrega"
          icon={Clock}
          colorScheme="amber"
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Faturamento Bruto"
          value={`R$ ${(reportData.grossRevenue / 1000).toFixed(1)}k`}
          subtitle={`R$ ${reportData.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorScheme="emerald"
          trend={{ value: 18.2, isPositive: true }}
          onClick={() => onNavigate('financial')}
        />
        <StatCard
          title="Receita da Plataforma"
          value={`R$ ${(reportData.platformRevenue / 1000).toFixed(1)}k`}
          subtitle="Comissões + Taxas"
          icon={TrendingUp}
          colorScheme="orange"
          trend={{ value: 15.6, isPositive: true }}
          onClick={() => onNavigate('financial')}
        />
        <StatCard
          title="Comissões Estimadas"
          value={`R$ ${(reportData.totalCommissions / 1000).toFixed(1)}k`}
          subtitle="Margem de intermediação"
          icon={Percent}
          colorScheme="blue"
          onClick={() => onNavigate('financial')}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${averageTicket.toFixed(2)}`}
          subtitle={`Cancelamento: ${reportData.cancellationRate}%`}
          icon={Receipt}
          colorScheme="rose"
        />
      </div>

      {/* Main Charts: Order & Revenue Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution of Revenue & Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evolução do Faturamento & Pedidos</h3>
              <p className="text-xs text-slate-500">Histórico de vendas diárias consolidadas</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +16.4%
            </span>
          </div>

          {displayedOrdersByDay.length === 0 ? (
            <div className="h-72 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <ShoppingBag className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-medium">Nenhum pedido registrado no período selecionado</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayedOrdersByDay.slice(-14)}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6600" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'revenue' ? `R$ ${Number(val).toFixed(2)}` : val,
                      name === 'revenue' ? 'Faturamento' : 'Pedidos',
                    ]}
                    labelFormatter={(lbl) => `Data: ${lbl}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff6600"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Orders by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pedidos por Categoria</h3>
              <p className="text-xs text-slate-500">Volume de compras segmentado por gastronomia</p>
            </div>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Ver categorias →
            </button>
          </div>

          {displayedCategorySales.length === 0 ? (
            <div className="h-72 w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Store className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-medium">Nenhuma venda por categoria registrada</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedCategorySales}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={95}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} pedidos`, 'Volume']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ff6600" radius={[0, 6, 6, 0]}>
                    {(categorySales.length > 0 ? categorySales : reportData.ordersByCategory).map(
                      (_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Top Restaurants & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Restaurants Table - GET /api/v1/reports/admin/top-restaurants */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restaurantes com Maior Volume de Vendas</h3>
              <p className="text-xs text-slate-500">Ranking por faturamento bruto gerado (API)</p>
            </div>
            <button
              onClick={() => onNavigate('restaurants')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Ver todos ({restaurants.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Restaurante</th>
                  <th className="py-2.5 px-3">Pedidos</th>
                  <th className="py-2.5 px-3">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedTopRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhum estabelecimento ou venda registrada no período.
                    </td>
                  </tr>
                ) : (
                  displayedTopRestaurants.map(
                    (rest, index) => (
                      <tr key={rest.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-400">{index + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{rest.name}</td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            {rest.orders} pedidos
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600">
                          R$ {rest.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onNavigate('restaurants', rest.id)}
                            className="text-orange-600 hover:text-orange-700 text-xs font-semibold"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by Status Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Distribuição de Status dos Pedidos</h3>
            <p className="text-xs text-slate-500">Composição dos pedidos no período</p>
          </div>

          {displayedOrdersByStatus.length === 0 ? (
            <div className="h-56 w-full my-auto flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-medium">Nenhum pedido para compor status</p>
            </div>
          ) : (
            <>
              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayedOrdersByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {displayedOrdersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} pedidos`, name]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {displayedOrdersByStatus.slice(0, 6).map((item, idx) => (
                  <div key={item.status} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate text-slate-600">{item.status}:</span>
                    <span className="font-bold text-slate-900 ml-auto">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
