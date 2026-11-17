import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw,
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Sliders,
  Send,
  Filter,
} from 'lucide-react';
import { financialService } from '../services/financialService';
import { restaurantService } from '../services/restaurantService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import type { FinancialRecord, PayoutStatus, Restaurant } from '../types';

export const FinancialPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [records, setRecords] = useState<FinancialRecord[]>(financialService.getAll());
  const restaurants = restaurantService.getAll();
  const settings = settingsService.get();

  // Filters
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Global commission config modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [defaultCommission, setDefaultCommission] = useState(settings.defaultCommissionRate);
  const [defaultFixed, setDefaultFixed] = useState(settings.defaultFixedFee);
  const [defaultService, setDefaultService] = useState(settings.defaultServiceFeeRate);

  const refreshList = () => {
    setRecords(financialService.getAll());
  };

  const summary = useMemo(() => {
    return financialService.getSummary(restaurantFilter === 'all' ? undefined : restaurantFilter);
  }, [records, restaurantFilter]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchRest = restaurantFilter === 'all' || r.restaurantId === restaurantFilter;
      const matchStatus = payoutStatusFilter === 'all' || r.payoutStatus === payoutStatusFilter;
      return matchRest && matchStatus;
    });
  }, [records, restaurantFilter, payoutStatusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getPayoutBadgeVariant = (status: PayoutStatus): BadgeVariant => {
    switch (status) {
      case 'Pago':
        return 'success';
      case 'Processado':
        return 'info';
      case 'Pendente':
        return 'warning';
      case 'Retido':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const handleUpdateStatus = (id: string, newStatus: PayoutStatus) => {
    financialService.updatePayoutStatus(id, newStatus, currentUser);
    success(`Status do repasse alterado para "${newStatus}".`);
    refreshList();
  };

  const handleBatchProcess = () => {
    const count = financialService.batchProcessPayouts(
      restaurantFilter === 'all' ? undefined : restaurantFilter,
      currentUser
    );
    success(`Lote de ${count} repasses processado com sucesso!`);
    refreshList();
  };

  const handleSaveDefaultCommissions = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.update(
      {
        defaultCommissionRate: Number(defaultCommission),
        defaultFixedFee: Number(defaultFixed),
        defaultServiceFeeRate: Number(defaultService),
      },
      currentUser
    );
    success('Parâmetros globais de taxas e comissões atualizados!');
    setIsConfigOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão Financeira & Repasses
            </h1>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Ambiente de Simulação
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de comissões, faturamento bruto da plataforma, taxas operacionais e conciliação de repasses aos parceiros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Sliders className="w-4 h-4 text-orange-600" />
            <span>Configurar Comissões Padrão</span>
          </button>

          <button
            onClick={handleBatchProcess}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Processar Lote de Repasses</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Bruto"
          value={`R$ ${(summary.grossVolume / 1000).toFixed(1)}k`}
          subtitle={`R$ ${summary.grossVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorScheme="emerald"
        />
        <StatCard
          title="Receita da Plataforma"
          value={`R$ ${(summary.platformRevenue / 1000).toFixed(1)}k`}
          subtitle="Comissões + Taxas de serviço"
          icon={TrendingUp}
          colorScheme="orange"
        />
        <StatCard
          title="Comissões Totais"
          value={`R$ ${(summary.totalCommissions / 1000).toFixed(1)}k`}
          subtitle="Margem sobre o marketplace"
          icon={Percent}
          colorScheme="blue"
        />
        <StatCard
          title="Taxas de Serviço"
          value={`R$ ${(summary.totalServiceFees / 1000).toFixed(1)}k`}
          subtitle="Arrecadação operacional"
          icon={Receipt}
          colorScheme="purple"
        />
      </div>

      {/* Payout & Liquidation Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">A Repassar (Pendente)</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            R$ {summary.pendingPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Aguardando fechamento do ciclo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Repasses Processados</span>
          <p className="text-xl font-black text-blue-600 mt-1">
            R$ {summary.processedPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Lote gerado para liquidação</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Pago / Liquidado</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            R$ {summary.paidPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Transferências simuladas com sucesso</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Cancelados & Reembolsos</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            R$ {summary.cancelledAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Estornos de pedidos não finalizados</span>
        </div>
      </div>

      {/* Extrato Simulado Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Extrato Financeiro Fictício por Estabelecimento
            </h3>
            <p className="text-xs text-slate-500">
              Detalhamento de cada pedido, comissão retida, taxas e valor líquido estimado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Restaurant Filter */}
            <select
              value={restaurantFilter}
              onChange={(e) => {
                setRestaurantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-700 font-medium"
            >
              <option value="all">Todos os Estabelecimentos</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Payout status filter */}
            <select
              value={payoutStatusFilter}
              onChange={(e) => {
                setPayoutStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-700 font-medium"
            >
              <option value="all">Status: Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Processado">Processado</option>
              <option value="Pago">Pago</option>
              <option value="Retido">Retido</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Data do Pedido</th>
                <th className="py-3 px-4">Valor Bruto</th>
                <th className="py-3 px-4">Comissão Retida</th>
                <th className="py-3 px-4">Taxas</th>
                <th className="py-3 px-4">Líquido a Repassar</th>
                <th className="py-3 px-4">Status Repasse</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-orange-600 font-mono">
                    {rec.orderCode}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{rec.restaurantName}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(rec.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    R$ {rec.grossAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 font-medium">
                    - R$ {rec.commissionAmount.toFixed(2)}{' '}
                    <span className="text-[10px] text-slate-400">({rec.commissionPercentage}%)</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    - R$ {rec.serviceFee.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    R$ {rec.netAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={getPayoutBadgeVariant(rec.payoutStatus)} dot>
                      {rec.payoutStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={rec.payoutStatus}
                      onChange={(e) => handleUpdateStatus(rec.id, e.target.value as PayoutStatus)}
                      className="bg-white border border-slate-300 rounded-lg text-[11px] py-1 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Processado">Processado</option>
                      <option value="Pago">Pago</option>
                      <option value="Retido">Retido</option>
                    </select>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum lançamento financeiro encontrado para os filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Global Commission Config Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Parâmetros Globais de Comissões e Taxas"
        subtitle="Regras aplicadas aos novos estabelecimentos homologados no marketplace"
      >
        <form onSubmit={handleSaveDefaultCommissions} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comissão Padrão do Marketplace (%) *
            </label>
            <input
              type="number"
              step="0.5"
              required
              value={defaultCommission}
              onChange={(e) => setDefaultCommission(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Taxa Fixa por Pedido (R$) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={defaultFixed}
              onChange={(e) => setDefaultFixed(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Taxa de Serviço Cobrada do Cliente (%) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={defaultService}
              onChange={(e) => setDefaultService(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Salvar Parâmetros
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
