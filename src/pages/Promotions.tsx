import React, { useState, useMemo } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  Tag,
} from 'lucide-react';
import { promotionService } from '../services/promotionService';
import { restaurantService } from '../services/restaurantService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import type { Promotion, PromotionStatus, PromotionType, TargetAudience } from '../types';

export const PromotionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [promotions, setPromotions] = useState<Promotion[]>(promotionService.getAll());
  const restaurants = restaurantService.getAll();
  const categories = categoryService.getAll();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'coupon' as PromotionType,
    discountValue: 15,
    minOrderValue: 30,
    startDate: '2026-11-16',
    endDate: '2026-12-31',
    budget: 2000,
    maxUses: 200,
    targetAudience: 'all' as TargetAudience,
    status: 'Ativa' as PromotionStatus,
    categoryId: '',
    restaurantId: '',
    description: '',
  });

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const refreshList = () => {
    setPromotions(promotionService.getAll());
  };

  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [promotions, searchTerm, typeFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadgeVariant = (status: PromotionStatus): BadgeVariant => {
    switch (status) {
      case 'Ativa':
        return 'success';
      case 'Agendada':
        return 'purple';
      case 'Pausada':
        return 'warning';
      case 'Expirada':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      name: '',
      code: '',
      type: 'coupon',
      discountValue: 15,
      minOrderValue: 30,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      budget: 2000,
      maxUses: 200,
      targetAudience: 'all',
      status: 'Ativa',
      categoryId: '',
      restaurantId: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      code: promo.code || '',
      type: promo.type,
      discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      budget: promo.budget,
      maxUses: promo.maxUses,
      targetAudience: promo.targetAudience,
      status: promo.status,
      categoryId: promo.categoryId || '',
      restaurantId: promo.restaurantId || '',
      description: promo.description,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('O nome da promoção é obrigatório.');
      return;
    }

    const catObj = categories.find((c) => c.id === formData.categoryId);
    const restObj = restaurants.find((r) => r.id === formData.restaurantId);

    if (editingPromo) {
      promotionService.update(
        editingPromo.id,
        {
          ...formData,
          categoryName: catObj?.name,
          restaurantName: restObj?.name,
        },
        currentUser
      );
      success(`Promoção "${formData.name}" atualizada!`);
    } else {
      promotionService.create(
        {
          ...formData,
          categoryName: catObj?.name,
          restaurantName: restObj?.name,
        },
        currentUser
      );
      success(`Promoção "${formData.name}" criada com sucesso!`);
    }

    setIsModalOpen(false);
    refreshList();
  };

  const handleToggleStatus = (promo: Promotion) => {
    promotionService.toggleStatus(promo.id, currentUser);
    info(`Status da campanha "${promo.name}" alterado.`);
    refreshList();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    promotionService.delete(deleteTarget.id, currentUser);
    success(`Promoção "${deleteTarget.name}" excluída.`);
    setDeleteTarget(null);
    refreshList();
  };

  const typeLabels: Record<PromotionType, string> = {
    percent: 'Desconto Percentual',
    fixed: 'Desconto Fixo',
    free_shipping: 'Frete Grátis',
    coupon: 'Cupom Promocional',
    category: 'Por Categoria',
    restaurant: 'Por Estabelecimento',
  };

  const audienceLabels: Record<TargetAudience, string> = {
    all: 'Todos os Clientes',
    new_customers: 'Novos Usuários',
    vip: 'Clientes VIP',
    inactive: 'Usuários Inativos',
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Promoções & Campanhas
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {promotions.length} campanhas ativas/configuradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de cupons de desconto, frete grátis, orçamento promocional e público-alvo da plataforma.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Campanha ou Cupom</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nome ou código do cupom..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
        >
          <option value="all">Tipos: Todos</option>
          <option value="coupon">Cupom Promocional</option>
          <option value="percent">Desconto Percentual</option>
          <option value="fixed">Desconto Fixo</option>
          <option value="free_shipping">Frete Grátis</option>
          <option value="category">Campanha por Categoria</option>
          <option value="restaurant">Campanha por Estabelecimento</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
        >
          <option value="all">Status: Todos</option>
          <option value="Ativa">Ativa</option>
          <option value="Agendada">Agendada</option>
          <option value="Pausada">Pausada</option>
          <option value="Expirada">Expirada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Campanha / Cupom</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Benefício</th>
                <th className="py-3 px-4">Vigência</th>
                <th className="py-3 px-4">Orçamento Utilizado</th>
                <th className="py-3 px-4">Utilizações</th>
                <th className="py-3 px-4">Público-Alvo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    {p.code ? (
                      <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block mt-0.5">
                        {p.code}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Automático</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {typeLabels[p.type]}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {p.type === 'percent'
                      ? `${p.discountValue}% OFF`
                      : p.type === 'fixed'
                      ? `R$ ${p.discountValue.toFixed(2)} OFF`
                      : p.type === 'free_shipping'
                      ? 'Frete Grátis'
                      : `R$ ${p.discountValue.toFixed(2)} OFF`}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(p.startDate).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(p.endDate).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>R$ {p.usedBudget}</span>
                        <span className="text-slate-400">/ R$ {p.budget}</span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (p.usedBudget / p.budget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {p.currentUses} / {p.maxUses}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                      {audienceLabels[p.targetAudience]}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusBadgeVariant(p.status)} dot>
                      {p.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        title={p.status === 'Ativa' ? 'Pausar promoção' : 'Ativar promoção'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.status === 'Ativa'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {p.status === 'Ativa' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Editar promoção"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(p)}
                        title="Excluir promoção"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhuma promoção encontrada para os filtros.
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPromo ? 'Editar Campanha' : 'Criar Nova Campanha Promocional'}
        subtitle="Defina o tipo, desconto, vigência e público-alvo"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Campanha *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sexta-Feira com Frete Grátis"
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código do Cupom (Opcional)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: OBA20, SEXTOU"
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Promoção *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
              >
                <option value="coupon">Cupom Promocional</option>
                <option value="percent">Desconto Percentual (%)</option>
                <option value="fixed">Desconto Fixo em Reais (R$)</option>
                <option value="free_shipping">Frete Grátis</option>
                <option value="category">Campanha por Categoria</option>
                <option value="restaurant">Campanha por Estabelecimento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor do Desconto (R$ ou %)
              </label>
              <input
                type="number"
                min={0}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pedido Mínimo (R$)
              </label>
              <input
                type="number"
                min={0}
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Orçamento Fictício Máximo (R$)
              </label>
              <input
                type="number"
                min={100}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Término</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Público-Alvo</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as TargetAudience })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="all">Todos os Clientes</option>
                <option value="new_customers">Novos Clientes (1ª compra)</option>
                <option value="vip">Clientes VIP (Alto volume)</option>
                <option value="inactive">Clientes Inativos (+30 dias)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Limite de Utilizações</label>
              <input
                type="number"
                min={1}
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Salvar Campanha
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Promoção"
        message={`Deseja realmente excluir a campanha "${deleteTarget?.name}"?`}
        variant="danger"
        confirmText="Excluir Promoção"
      />
    </div>
  );
};
