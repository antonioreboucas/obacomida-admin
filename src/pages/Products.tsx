import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign,
  History,
} from 'lucide-react';
import { productService } from '../services/productService';
import { restaurantService } from '../services/restaurantService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import type { Product, ProductStatus } from '../types';

export const ProductsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>(productService.getAll());
  const restaurants = restaurantService.getAll();
  const categories = categoryService.getAll();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Moderation Dialog
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [moderationAction, setModerationAction] = useState<ProductStatus | null>(null);
  const [moderationJustification, setModerationJustification] = useState('');

  // Product Detail Modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const refreshList = () => {
    setProducts(productService.getAll());
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchRest = restaurantFilter === 'all' || p.restaurantId === restaurantFilter;
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      const matchAvail =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' ? p.available : !p.available);
      return matchSearch && matchStatus && matchRest && matchCat && matchAvail;
    });
  }, [products, searchTerm, statusFilter, restaurantFilter, categoryFilter, availabilityFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadgeVariant = (status: ProductStatus): BadgeVariant => {
    switch (status) {
      case 'Aprovado':
        return 'success';
      case 'Em moderação':
        return 'warning';
      case 'Rejeitado':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const handleConfirmModeration = () => {
    if (!targetProduct || !moderationAction) return;

    if (!moderationJustification.trim()) {
      error('É obrigatório registrar uma justificativa para a moderação administrativa.');
      return;
    }

    productService.moderate(
      targetProduct.id,
      moderationAction,
      moderationJustification,
      currentUser
    );

    success(`Produto "${targetProduct.name}" atualizado para "${moderationAction}".`);
    setTargetProduct(null);
    setModerationAction(null);
    setModerationJustification('');
    refreshList();
    if (detailProduct?.id === targetProduct.id) {
      setDetailProduct(productService.getById(targetProduct.id) || null);
    }
  };

  const handleToggleAvailability = (prod: Product) => {
    const reason = prompt('Informe a justificativa para alterar a disponibilidade:') || 'Ajuste manual pela administração';
    productService.toggleAvailability(prod.id, currentUser, reason);
    success(`Disponibilidade de "${prod.name}" alterada.`);
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Moderação de Cardápio & Produtos
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {products.length} itens cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoria e moderação de fotos, descrições e conformidade de preços dos pratos ofertados pelos estabelecimentos.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por prato ou restaurante..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Moderação: Todos</option>
              <option value="Aprovado">Aprovados</option>
              <option value="Em moderação">Em moderação</option>
              <option value="Rejeitado">Rejeitados</option>
            </select>
          </div>

          {/* Restaurant filter */}
          <div>
            <select
              value={restaurantFilter}
              onChange={(e) => {
                setRestaurantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700 truncate"
            >
              <option value="all">Restaurantes: Todos</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Categorias: Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Disponibilidade: Todas</option>
              <option value="available">Disponíveis</option>
              <option value="unavailable">Indisponíveis / Esgotados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Preço Original</th>
                <th className="py-3 px-4">Preço Promocional</th>
                <th className="py-3 px-4">Disponibilidade</th>
                <th className="py-3 px-4">Status de Moderação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div>
                        <p
                          onClick={() => setDetailProduct(p)}
                          className="font-bold text-slate-900 hover:text-orange-600 cursor-pointer"
                        >
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{p.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">{p.restaurantName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.categoryName}</td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    R$ {p.price.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4">
                    {p.promotionalPrice ? (
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        R$ {p.promotionalPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleAvailability(p)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                        p.available
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Clique para alternar disponibilidade"
                    >
                      {p.available ? 'Disponível' : 'Esgotado'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusBadgeVariant(p.status)} dot>
                      {p.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailProduct(p)}
                        title="Ver detalhes e histórico de moderação"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {p.status !== 'Aprovado' && (
                        <button
                          onClick={() => {
                            setTargetProduct(p);
                            setModerationAction('Aprovado');
                          }}
                          title="Aprovar produto"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {p.status !== 'Rejeitado' && (
                        <button
                          onClick={() => {
                            setTargetProduct(p);
                            setModerationAction('Rejeitado');
                          }}
                          title="Rejeitar produto"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado para os filtros selecionados.
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

      {/* Product Detail Modal */}
      {detailProduct && (
        <Modal
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          title={detailProduct.name}
          subtitle={`Restaurante: ${detailProduct.restaurantName} • Categoria: ${detailProduct.categoryName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={detailProduct.image}
                alt={detailProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Descrição do Produto</h4>
              <p className="text-slate-600">{detailProduct.description}</p>
              <div className="flex gap-4 pt-2">
                <div>
                  <span className="text-slate-400 block font-medium">Preço</span>
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {detailProduct.price.toFixed(2)}
                  </span>
                </div>
                {detailProduct.promotionalPrice && (
                  <div>
                    <span className="text-slate-400 block font-medium">Preço Promocional</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      R$ {detailProduct.promotionalPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <Badge variant={getStatusBadgeVariant(detailProduct.status)} dot>
                    {detailProduct.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Moderation History */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-orange-600" /> Histórico de Moderações Administrativas
              </h4>
              <div className="space-y-2">
                {detailProduct.moderationHistory.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>{m.action}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(m.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 italic">"{m.justification}"</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Moderador: <strong>{m.adminName}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Moderation Action Dialog */}
      <ConfirmDialog
        isOpen={!!targetProduct && !!moderationAction}
        onClose={() => {
          setTargetProduct(null);
          setModerationAction(null);
        }}
        onConfirm={handleConfirmModeration}
        title={`Moderação de Produto: ${moderationAction}`}
        message={`Confirma a alteração do produto "${targetProduct?.name}" para "${moderationAction}"?`}
        variant={moderationAction === 'Rejeitado' ? 'danger' : 'primary'}
        requireReason
        reasonValue={moderationJustification}
        onReasonChange={setModerationJustification}
        reasonPlaceholder="Informe a justificativa técnica/operacional para este produto..."
        confirmText="Confirmar Moderação"
      />
    </div>
  );
};
