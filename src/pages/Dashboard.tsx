import React, { useState, useMemo } from 'react';
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
import { db } from '../storage/db';
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

  // Fetch report data dynamically
  const reportData = useMemo(() => {
    return reportService.generateReport({
      period: filterPeriod,
      startDate: customStart,
      endDate: customEnd,
    });
  }, [filterPeriod, customStart, customEnd]);

  const restaurants = db.getRestaurants();
  const customers = db.getCustomers();
  const orders = db.getOrders();

  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter((r) => r.status === 'Ativo').length;
  const pendingRestaurants = restaurants.filter(
    (r) => r.status === 'Pendente' || r.status === 'Em análise'
  ).length;

  const totalCustomers = customers.length;
  const activeOrdersCount = orders.filter((o) =>
    ['Criado', 'Confirmado', 'Em preparação', 'Saiu para entrega'].includes(o.status)
  ).length;

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Restaurantes Cadastrados"
          value={totalRestaurants}
          subtitle={`${activeRestaurants} ativos • ${pendingRestaurants} pendentes`}
          icon={Store}
          colorScheme="orange"
          onClick={() => onNavigate('restaurants')}
        />
        <StatCard
          title="Restaurantes Ativos"
          value={activeRestaurants}
          subtitle={`${((activeRestaurants / totalRestaurants) * 100).toFixed(0)}% da base`}
          icon={Store}
          colorScheme="emerald"
          onClick={() => onNavigate('restaurants')}
        />
        <StatCard
          title="Restaurantes Pendentes"
          value={pendingRestaurants}
          subtitle="Requerem homologação"
          icon={AlertCircle}
          colorScheme={pendingRestaurants > 0 ? 'amber' : 'neutral'}
          onClick={() => onNavigate('restaurants')}
        />
        <StatCard
          title="Total de Clientes"
          value={totalCustomers}
          subtitle="Consumidores ativos"
          icon={Users}
          colorScheme="blue"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          title="Pedidos Realizados"
          value={reportData.totalOrders}
          subtitle={`No período (${filterPeriod})`}
          icon={ShoppingBag}
          colorScheme="purple"
          trend={{ value: 14.8, isPositive: true }}
          onClick={() => onNavigate('orders')}
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
          value={`R$ ${reportData.averageTicket.toFixed(2)}`}
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

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.ordersByDay.slice(-14)}>
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

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.ordersByCategory} layout="vertical">
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
                  {reportData.ordersByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Restaurants & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Restaurants Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restaurantes com Maior Volume de Vendas</h3>
              <p className="text-xs text-slate-500">Ranking por faturamento bruto gerado</p>
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
                {reportData.topRestaurants.map((rest, index) => (
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
                ))}
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

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {reportData.ordersByStatus.map((_, index) => (
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
            {reportData.ordersByStatus.slice(0, 6).map((item, idx) => (
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
        </div>
      </div>
    </div>
  );
};
