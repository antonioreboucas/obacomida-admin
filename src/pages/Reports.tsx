import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Receipt,
  Percent,
} from 'lucide-react';
import { reportService, type ReportFilter } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { success } = useToast();

  const [period, setPeriod] = useState<ReportFilter['period']>('30days');
  const [cityFilter, setCityFilter] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const reportData = useMemo(() => {
    return reportService.generateReport({
      period,
      city: cityFilter || undefined,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    });
  }, [period, cityFilter, customStart, customEnd]);

  const handleExportCsv = () => {
    reportService.exportToCsv(reportData, `relatorio_oba_comida_${period}.csv`);
    success('Relatório exportado em formato CSV com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Relatórios Executivos & BI
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Exportação CSV Disponível
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análises gerenciais de vendas, receita líquida, ranking de parceiros, clientes e cardápio.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório (CSV)</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: '7days', label: 'Últimos 7 dias' },
              { id: '30days', label: 'Últimos 30 dias' },
              { id: 'thisMonth', label: 'Este mês' },
              { id: 'lastMonth', label: 'Mês anterior' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-white text-orange-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
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

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-700 font-medium"
        >
          <option value="">Todas as Cidades</option>
          <option value="São Paulo">São Paulo (SP)</option>
          <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
          <option value="Belo Horizonte">Belo Horizonte (MG)</option>
          <option value="Curitiba">Curitiba (PR)</option>
          <option value="Campinas">Campinas (SP)</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Bruto"
          value={`R$ ${(reportData.grossRevenue / 1000).toFixed(1)}k`}
          subtitle={`R$ ${reportData.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Receita da Plataforma"
          value={`R$ ${(reportData.platformRevenue / 1000).toFixed(1)}k`}
          subtitle="Comissões + Taxas de intermediação"
          icon={TrendingUp}
          colorScheme="orange"
        />
        <StatCard
          title="Pedidos no Período"
          value={reportData.totalOrders}
          subtitle={`Ticket médio: R$ ${reportData.averageTicket.toFixed(2)}`}
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <StatCard
          title="Taxa de Cancelamento"
          value={`${reportData.cancellationRate}%`}
          subtitle="Índice de perda operacional"
          icon={Percent}
          colorScheme={reportData.cancellationRate > 5 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Tables Row: Top Selling Products & Most Active Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Produtos Mais Vendidos</h3>
          <p className="text-xs text-slate-500 mb-4">Ranking de pratos por volume e faturamento</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Prato</th>
                  <th className="py-2.5 px-3">Estabelecimento</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reportData.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.restaurantName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-orange-600">{p.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      R$ {p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Clientes Mais Ativos</h3>
          <p className="text-xs text-slate-500 mb-4">Consumidores com maior frequência de pedidos</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Consumidor</th>
                  <th className="py-2.5 px-3 text-center">Pedidos</th>
                  <th className="py-2.5 px-3 text-right">Gasto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reportData.topCustomers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-slate-100 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        {c.orders} pedidos
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      R$ {c.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
