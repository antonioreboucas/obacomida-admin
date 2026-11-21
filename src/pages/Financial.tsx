import React, { useState, useMemo, useEffect } from 'react';
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
  CheckSquare,
  Square,
  CreditCard,
  Layers,
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
import type { FinancialRecord, PayoutStatus, FinancialCommission, FinancialTransaction, Restaurant } from '../types';

export const FinancialPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, info, error } = useToast();

  const [activeTab, setActiveTab] = useState<'commissions' | 'transactions'>('commissions');
  const [commissions, setCommissions] = useState<FinancialCommission[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const settings = settingsService.get();

  // Multi-selection for batch reconciliation (Checklist Item 5)
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<Set<string>>(new Set());
  const [isSettlingBatch, setIsSettlingBatch] = useState(false);

  // Filters
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [settledFilter, setSettledFilter] = useState<string>('all'); // all, pending, settled

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Global commission config modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [defaultCommission, setDefaultCommission] = useState(settings.defaultCommissionRate);
  const [defaultFixed, setDefaultFixed] = useState(settings.defaultFixedFee);
  const [defaultService, setDefaultService] = useState(settings.defaultServiceFeeRate);

  const refreshList = async () => {
    setIsLoading(true);
    try {
      const isSettledParam =
        settledFilter === 'settled' ? true : settledFilter === 'pending' ? false : undefined;

      const [commList, txList, restList] = await Promise.all([
        financialService.fetchCommissions(restaurantFilter, isSettledParam),
        financialService.fetchTransactions(),
        restaurantService.fetchAdminRestaurants(),
      ]);

      setCommissions(commList);
      setTransactions(txList);
      setRestaurants(restList);
      setSelectedCommissionIds(new Set());
    } catch (err) {
      console.warn('Erro ao carregar dados financeiros:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, [restaurantFilter, settledFilter]);

  const summary = useMemo(() => {
    if (commissions.length > 0) {
      const grossVolume = commissions.reduce((sum, c) => sum + (c.order_amount || 0), 0);
      const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const pendingPayouts = commissions.filter((c) => !c.is_settled).reduce((sum, c) => sum + (c.net_amount || 0), 0);
      const paidPayouts = commissions.filter((c) => c.is_settled).reduce((sum, c) => sum + (c.net_amount || 0), 0);
      return {
        grossVolume,
        platformRevenue: totalCommissions,
        totalCommissions,
        totalServiceFees: 0,
        totalDeliveryFees: 0,
        cancelledAmount: 0,
        refundedAmount: 0,
        pendingPayouts,
        processedPayouts: 0,
        paidPayouts,
        retainedPayouts: totalCommissions,
      };
    }
    return financialService.getSummary(restaurantFilter === 'all' ? undefined : restaurantFilter);
  }, [commissions, restaurantFilter]);

  // Paginated List
  const paginatedCommissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return commissions.slice(start, start + itemsPerPage);
  }, [commissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(commissions.length / itemsPerPage);

  // Batch Selection helpers
  const handleToggleSelectAll = () => {
    if (selectedCommissionIds.size === paginatedCommissions.length && paginatedCommissions.length > 0) {
      setSelectedCommissionIds(new Set());
    } else {
      const allIds = new Set(paginatedCommissions.map((c) => c.id));
      setSelectedCommissionIds(allIds);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedCommissionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCommissionIds(next);
  };

  // Conciliação em Lote (POST /api/v1/financial/commissions/settle)
  const handleBatchSettle = async () => {
    const ids = Array.from(selectedCommissionIds);
    if (ids.length === 0) {
      info('Selecione pelo menos uma comissão para liquidar/conciliar.');
      return;
    }

    setIsSettlingBatch(true);
    try {
      const res = await financialService.settleCommissions(ids, currentUser);
      success('Liquidação em lote efetuada!', res.message);
      refreshList();
    } catch (err: any) {
      error('Falha na liquidação:', err.message);
    } finally {
      setIsSettlingBatch(false);
    }
  };

  const handleSaveDefaultCommissions = async (e: React.FormEvent) => {
    e.preventDefault();
    await financialService.createCommissionPolicy(
      {
        restaurant_id: null,
        percentage: Number(defaultCommission),
        fixed_fee: Number(defaultFixed),
        service_fee: Number(defaultService),
      },
      currentUser
    );
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
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão Global de Pedidos & Financeiro
            </h1>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              API Conectada
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de comissões, faturamento bruto da plataforma, conciliação em lote e histórico de transações.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Sliders className="w-4 h-4 text-orange-600" />
            <span>Alíquotas Padrão</span>
          </button>

          <button
            onClick={handleBatchSettle}
            disabled={selectedCommissionIds.size === 0 || isSettlingBatch}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isSettlingBatch
                ? 'Conciliando...'
                : `Conciliar Lote (${selectedCommissionIds.size})`}
            </span>
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
          subtitle="Comissões retidas + taxas"
          icon={TrendingUp}
          colorScheme="orange"
        />
        <StatCard
          title="Comissões Totais"
          value={`R$ ${(summary.totalCommissions / 1000).toFixed(1)}k`}
          subtitle="Margem de intermediação"
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
          <span className="text-[10px] text-slate-400">Aguardando liquidação</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Repasses Processados</span>
          <p className="text-xl font-black text-blue-600 mt-1">
            R$ {summary.processedPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Lote gerado para conciliação</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Total Conciliado / Pago</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            R$ {summary.paidPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Liquidados via API</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold block">Cancelados & Reembolsos</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            R$ {summary.cancelledAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Estornos de pedidos não finalizados</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'commissions'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Relatório de Comissões & Repasses (Lojistas)
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'transactions'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Transações Financeiras Globais ({transactions.length})
        </button>
      </div>

      {/* TAB 1: Commissions Table with Batch Reconciliation */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Relatório de Comissões por Estabelecimento (Checklist Item 5)
              </h3>
              <p className="text-xs text-slate-500">
                Marque as caixas de seleção para conciliar repasses em lote via <code className="text-[11px] font-mono text-orange-600 bg-orange-50 px-1 py-0.5 rounded">POST /api/v1/financial/commissions/settle</code>
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

              {/* Settlement filter */}
              <select
                value={settledFilter}
                onChange={(e) => {
                  setSettledFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-700 font-medium"
              >
                <option value="all">Status: Todos</option>
                <option value="pending">Apenas Pendentes de Repasse</option>
                <option value="settled">Apenas Conciliados / Liquidados</option>
              </select>
            </div>
          </div>

          {/* Table with Selection Checkboxes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-700"
                      title="Selecionar todos da página"
                    >
                      {selectedCommissionIds.size === paginatedCommissions.length && paginatedCommissions.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Estabelecimento</th>
                  <th className="py-3 px-4">Data do Pedido</th>
                  <th className="py-3 px-4">Valor Bruto</th>
                  <th className="py-3 px-4">Alíquota (%)</th>
                  <th className="py-3 px-4">Comissão Retida</th>
                  <th className="py-3 px-4">Líquido a Repassar</th>
                  <th className="py-3 px-4 text-right">Status de Liquidação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedCommissions.map((c) => {
                  const isSelected = selectedCommissionIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(c.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600 font-mono">
                        {c.order_code || `#ORD-${c.order_id.slice(-4)}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {c.restaurant_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        R$ {c.order_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {c.commission_rate}%
                      </td>
                      <td className="py-3.5 px-4 text-rose-600 font-semibold">
                        - R$ {c.commission_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        R$ {c.net_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant={c.is_settled ? 'success' : 'warning'} dot>
                          {c.is_settled ? 'Liquidado' : 'Pendente'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}

                {paginatedCommissions.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Nenhum registro de comissão encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={commissions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* TAB 2: Global Financial Transactions (GET /api/v1/financial/transactions) */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Histórico de Transações Globais
              </h3>
              <p className="text-xs text-slate-500">
                Logs de liquidações, créditos, débitos e retenções financeiras no ecossistema
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              GET /financial/transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">ID Transação</th>
                  <th className="py-3 px-4">Estabelecimento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{tx.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{tx.restaurant_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.description}</td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.payment_method}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      R$ {tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'} dot>
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Commission Configuration Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Parâmetros Globais de Comissões e Taxas"
        subtitle="Defina as taxas padrão aplicadas a novos restaurantes parceiros cadastrados"
      >
        <form onSubmit={handleSaveDefaultCommissions} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comissão Padrão da Plataforma (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              required
              value={defaultCommission}
              onChange={(e) => setDefaultCommission(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Taxa Fixa por Pedido Padrão (R$)
            </label>
            <input
              type="number"
              step="0.10"
              min="0"
              required
              value={defaultFixed}
              onChange={(e) => setDefaultFixed(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Taxa de Serviço do Marketplace ao Consumidor (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
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
