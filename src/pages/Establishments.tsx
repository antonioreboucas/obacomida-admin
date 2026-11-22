import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Store,
  Plus,
  Search,
  Filter,
  Star,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Eye,
  SlidersHorizontal,
  MapPin,
  Phone,
  Calendar,
  Palette,
  Globe,
  Loader2,
} from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import { StoreThemePicker } from '../components/restaurant/StoreThemePicker';
import { StoreLinksModal } from '../components/restaurant/StoreLinksModal';
import { getDefaultThemeForCategory, THEME_PRESETS } from '../utils/themePresets';
import {
  generateSlug,
  sanitizeSlug,
  getStoreAppUrlDisplay,
  getStorePartnerUrlDisplay,
} from '../utils/slugUtils';
import type { Restaurant, RestaurantStatus, Category } from '../types';

interface EstablishmentsProps {
  onViewDetails: (restaurantId: string) => void;
}

export const Establishments: React.FC<EstablishmentsProps> = ({ onViewDetails }) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Lateral Inspection Drawer
  const [drawerRestaurant, setDrawerRestaurant] = useState<Restaurant | null>(null);

  // Status Action Modal
  const [targetRestaurant, setTargetRestaurant] = useState<Restaurant | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'activate' | null>(null);
  const [actionJustification, setActionJustification] = useState('');

  // Quick Commission Edit Modal
  const [commissionTarget, setCommissionTarget] = useState<Restaurant | null>(null);
  const [commissionRateInput, setCommissionRateInput] = useState(12.0);
  const [commissionFixedInput, setCommissionFixedInput] = useState(1.5);
  const [commissionJustification, setCommissionJustification] = useState('');
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  // Store Links Modal
  const [selectedLinksRestaurant, setSelectedLinksRestaurant] = useState<Restaurant | null>(null);

  // Register New Restaurant Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createTab, setCreateTab] = useState<'info' | 'theme'>('info');
  const [newRestData, setNewRestData] = useState({
    name: '',
    slug: '',
    slugManuallyEdited: false,
    categoryId: '',
    category: 'Hamburguerias',
    ownerName: '',
    phone: '',
    email: '',
    city: 'São Paulo',
    state: 'SP',
    address: '',
    zipCode: '01000-000',
    cnpj: '',
    commissionRate: 12.0,
    fixedFee: 1.5,
    minimumOrder: 25.0,
    deliveryTimeMin: 25,
    deliveryTimeMax: 40,
    deliveryFee: 6.9,
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
    isOpen: true,
    status: 'Ativo' as RestaurantStatus,
    theme: getDefaultThemeForCategory('Hamburguerias'),
  });

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, cats] = await Promise.all([
        restaurantService.fetchAdminRestaurants(statusFilter),
        categoryService.fetchGlobal(),
      ]);
      setRestaurants(data);
      setCategories(cats);
      if (cats && cats.length > 0) {
        setNewRestData((prev) => ({
          ...prev,
          categoryId: prev.categoryId || cats[0].id,
          category: prev.categoryId ? prev.category : cats[0].name,
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar lista de estabelecimentos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Filtered List
  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cnpj.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
      const matchCity = cityFilter === 'all' || r.city === cityFilter;
      return matchSearch && matchStatus && matchCat && matchCity;
    });
  }, [restaurants, searchTerm, statusFilter, categoryFilter, cityFilter]);

  // Paginated List
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadgeVariant = (status: RestaurantStatus): BadgeVariant => {
    switch (status) {
      case 'Ativo':
      case 'ACTIVE':
        return 'success';
      case 'Aprovado':
      case 'APPROVED':
        return 'info';
      case 'Pendente':
      case 'PENDING':
        return 'warning';
      case 'Em análise':
        return 'purple';
      case 'Suspenso':
      case 'SUSPENDED':
        return 'danger';
      case 'Reprovado':
      case 'REJECTED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!targetRestaurant || !actionType) return;

    if (actionType === 'approve') {
      await restaurantService.updateStatusApi(
        targetRestaurant.id,
        'APPROVED',
        currentUser,
        actionJustification || 'Documentação e alvará validados com sucesso.'
      );
      success(`Restaurante "${targetRestaurant.name}" homologado e aprovado com sucesso!`);
    } else if (actionType === 'reject') {
      await restaurantService.updateStatusApi(
        targetRestaurant.id,
        'REJECTED',
        currentUser,
        actionJustification || 'Documentação ou alvará reprovado pela moderação.'
      );
      info(`Restaurante "${targetRestaurant.name}" reprovado.`);
    } else if (actionType === 'suspend') {
      await restaurantService.updateStatusApi(
        targetRestaurant.id,
        'SUSPENDED',
        currentUser,
        actionJustification || 'Suspensão preventiva aplicada pela moderação.'
      );
      info(`Restaurante "${targetRestaurant.name}" suspenso preventivamente.`);
    } else if (actionType === 'activate') {
      await restaurantService.updateStatusApi(
        targetRestaurant.id,
        'ACTIVE',
        currentUser,
        actionJustification || 'Reativação operacional efetuada.'
      );
      success(`Restaurante "${targetRestaurant.name}" ativado com sucesso!`);
    }

    if (drawerRestaurant?.id === targetRestaurant.id) {
      const updated = restaurantService.getById(targetRestaurant.id);
      if (updated) setDrawerRestaurant(updated);
    }

    setTargetRestaurant(null);
    setActionType(null);
    setActionJustification('');
    refreshList();
  };

  const handleOpenCommissionModal = (r: Restaurant) => {
    setCommissionTarget(r);
    setCommissionRateInput(r.commissionRate);
    setCommissionFixedInput(r.fixedFee);
    setCommissionJustification('');
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionTarget) return;

    setIsSavingCommission(true);
    try {
      await restaurantService.updateCommissionApi(
        commissionTarget.id,
        commissionRateInput,
        commissionFixedInput,
        currentUser,
        commissionJustification || 'Ajuste contratual administrativo'
      );
      success(`Comissão de "${commissionTarget.name}" atualizada para ${commissionRateInput}%!`);
      if (drawerRestaurant?.id === commissionTarget.id) {
        const updated = restaurantService.getById(commissionTarget.id);
        if (updated) setDrawerRestaurant(updated);
      }
      setCommissionTarget(null);
      refreshList();
    } catch (err: any) {
      error('Falha ao atualizar comissão:', err.message);
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestData.name?.trim() || !newRestData.ownerName?.trim() || !newRestData.phone?.trim() || !newRestData.cnpj?.trim()) {
      error('Preencha os campos obrigatórios (Nome, Responsável, Telefone e CNPJ).');
      return;
    }

    const cleanCnpj = newRestData.cnpj.trim();
    if (cleanCnpj.length < 14) {
      error('O CNPJ deve ter no mínimo 14 caracteres (ex: 00.000.000/0001-00).');
      return;
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let catObj =
      categories.find((c) => c.id === newRestData.categoryId) ||
      categories.find((c) => c.name.toLowerCase() === (newRestData.category || '').toLowerCase()) ||
      categories.find((c) => UUID_REGEX.test(c.id)) ||
      categories[0];

    if (!catObj) {
      error('Nenhuma categoria cadastrada no banco de dados. Cadastre ao menos uma categoria em "Categorias" antes de cadastrar o restaurante.');
      return;
    }

    const finalSlug = newRestData.slug ? sanitizeSlug(newRestData.slug) : generateSlug(newRestData.name);

    setIsCreating(true);
    try {
      await restaurantService.createApi(
        {
          ...newRestData,
          slug: finalSlug,
          categoryId: catObj.id,
          category: catObj.name,
        },
        currentUser
      );

      success(`Restaurante "${newRestData.name}" salvo com sucesso no banco de dados!`);
      setIsCreateOpen(false);
      setNewRestData({
        name: '',
        slug: '',
        slugManuallyEdited: false,
        categoryId: catObj.id,
        category: catObj.name,
        ownerName: '',
        phone: '',
        email: '',
        city: 'São Paulo',
        state: 'SP',
        address: '',
        zipCode: '01000-000',
        cnpj: '',
        commissionRate: 12.0,
        fixedFee: 1.5,
        minimumOrder: 25.0,
        deliveryTimeMin: 25,
        deliveryTimeMax: 40,
        deliveryFee: 6.9,
        logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
        isOpen: true,
        status: 'Ativo' as RestaurantStatus,
        theme: getDefaultThemeForCategory(catObj.name),
      });
      setCreateTab('info');
      await refreshList();
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Não foi possível salvar o restaurante no banco de dados.';
      error('Falha ao cadastrar restaurante', errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Estabelecimentos
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {restaurants.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Homologação, moderação de taxas, comissões e acompanhamento de parceiros.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Estabelecimento</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              placeholder="Buscar por nome, responsável ou CNPJ..."
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
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Pendente">Pendente</option>
              <option value="Em análise">Em análise</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Reprovado">Reprovado</option>
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
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Todas as Cidades</option>
              <option value="São Paulo">São Paulo (SP)</option>
              <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
              <option value="Belo Horizonte">Belo Horizonte (MG)</option>
              <option value="Curitiba">Curitiba (PR)</option>
              <option value="Campinas">Campinas (SP)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Responsável / Contato</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Pedidos</th>
                <th className="py-3 px-4 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
                    <span>Carregando estabelecimentos (/admin/restaurants)...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum estabelecimento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.logo}
                        alt={r.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs hover:text-orange-600 cursor-pointer" onClick={() => onViewDetails(r.id)}>
                          {r.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.cnpj}</p>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLinksRestaurant(r);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-orange-600 hover:text-orange-700 hover:underline cursor-pointer mt-0.5"
                          title="Clique para ver os links do App e do Painel Parceiro"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]">/{r.slug}-app</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-lg text-[11px]">
                      {r.category}
                    </span>
                    <div
                      className="flex items-center gap-1.5 mt-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onViewDetails(r.id)}
                      title={`Tema da Loja: ${THEME_PRESETS.find((p) => p.key === r.theme?.presetKey)?.name || 'Personalizado'} (Primária: ${r.theme?.primaryColor || '#FF6600'} / Secundária: ${r.theme?.secondaryColor || '#E63946'})`}
                    >
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: r.theme?.primaryColor || '#FF6600' }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: r.theme?.secondaryColor || '#E63946' }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]">
                        {THEME_PRESETS.find((p) => p.key === r.theme?.presetKey)?.name || 'Cores da Loja'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{r.ownerName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.phone}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{r.city} - {r.state}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{typeof r.address === 'string' ? r.address : ''}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusBadgeVariant(r.status)} dot>
                      {r.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{r.rating > 0 ? r.rating.toFixed(1) : 'Novo'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{r.totalOrders.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-slate-400">R$ {(r.totalRevenue / 1000).toFixed(1)}k</p>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDrawerRestaurant(r)}
                        title="Inspecionar Dados e Ações Rápidas (Drawer Lateral)"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenCommissionModal(r)}
                        title="Configurar Alíquota de Comissão (%)"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <span className="font-bold text-xs">%</span>
                      </button>

                      <button
                        onClick={() => setSelectedLinksRestaurant(r)}
                        title="Links Oficiais (App & Painel Parceiro)"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewDetails(r.id)}
                        title="Personalizar Cores / Ver Detalhes"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Palette className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewDetails(r.id)}
                        title="Ver detalhes completos do estabelecimento"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Approval button if pending or in review */}
                      {(r.status === 'Pendente' || r.status === 'Em análise') && (
                        <>
                          <button
                            onClick={() => {
                              setTargetRestaurant(r);
                              setActionType('approve');
                            }}
                            title="Aprovar cadastro"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTargetRestaurant(r);
                              setActionType('reject');
                            }}
                            title="Reprovar cadastro"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Suspension toggle for active restaurants */}
                      {r.status === 'Ativo' && (
                        <button
                          onClick={() => {
                            setTargetRestaurant(r);
                            setActionType('suspend');
                          }}
                          title="Suspender temporariamente"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Reactivation for suspended restaurants */}
                      {r.status === 'Suspenso' && (
                        <button
                          onClick={() => {
                            setTargetRestaurant(r);
                            setActionType('activate');
                          }}
                          title="Reativar estabelecimento"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Register New Restaurant Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateTab('info');
        }}
        title="Cadastrar Novo Estabelecimento"
        subtitle="Adicione um novo parceiro e personalize suas cores para o app Oba Comida"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateRestaurant} className="space-y-5">
          {/* Tabs header inside modal */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setCreateTab('info')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                createTab === 'info'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>1. Dados Cadastrais & Operação</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateTab('theme')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                createTab === 'theme'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>2. Identidade Visual & Tema da Loja</span>
              <div className="flex items-center -space-x-1 ml-1">
                <span
                  className="w-3 h-3 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: newRestData.theme.primaryColor }}
                />
                <span
                  className="w-3 h-3 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: newRestData.theme.secondaryColor }}
                />
              </div>
            </button>
          </div>

          {/* TAB 1: Cadastral Info */}
          {createTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRestData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewRestData((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slugManuallyEdited ? prev.slug : generateSlug(name),
                      }));
                    }}
                    placeholder="Ex: Açaí Puro Sabor / Burguer King Prime"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link Exclusivo da Loja (Slug) *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
                    <span className="px-2.5 py-2 text-xs font-mono text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                      Identificador (slug):
                    </span>
                    <input
                      type="text"
                      required
                      value={newRestData.slug}
                      onChange={(e) => {
                        const clean = sanitizeSlug(e.target.value);
                        setNewRestData({ ...newRestData, slug: clean, slugManuallyEdited: true });
                      }}
                      placeholder="nomeloja"
                      className="w-full text-xs font-mono p-2.5 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                    App: <strong className="text-orange-600">{getStoreAppUrlDisplay(newRestData.slug || 'loja')}</strong> | Parceiro: <strong className="text-slate-700">{getStorePartnerUrlDisplay(newRestData.slug || 'loja')}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria * <span className="text-[10px] text-orange-600 font-normal">(Sugere paleta de cores automática)</span>
                  </label>
                  <select
                    value={newRestData.categoryId || (categories.find((c) => c.name === newRestData.category)?.id ?? '')}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const catObj = categories.find((c) => c.id === selectedId);
                      if (catObj) {
                        setNewRestData((prev) => ({
                          ...prev,
                          categoryId: catObj.id,
                          category: catObj.name,
                          theme: getDefaultThemeForCategory(catObj.name),
                        }));
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRestData.ownerName}
                    onChange={(e) => setNewRestData({ ...newRestData, ownerName: e.target.value })}
                    placeholder="Ex: Marcelo Guimarães"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={newRestData.cnpj}
                    onChange={(e) => setNewRestData({ ...newRestData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newRestData.phone}
                    onChange={(e) => setNewRestData({ ...newRestData, phone: e.target.value })}
                    placeholder="(11) 99999-8888"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Contato *</label>
                  <input
                    type="email"
                    required
                    value={newRestData.email}
                    onChange={(e) => setNewRestData({ ...newRestData, email: e.target.value })}
                    placeholder="contato@restaurante.com.br"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF / CEP *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newRestData.city}
                      onChange={(e) => setNewRestData({ ...newRestData, city: e.target.value })}
                      placeholder="Cidade"
                      className="w-1/2 text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newRestData.state}
                      onChange={(e) => setNewRestData({ ...newRestData, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      className="w-1/6 text-xs border border-slate-300 rounded-xl p-2.5 text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                    <input
                      type="text"
                      required
                      value={newRestData.zipCode}
                      onChange={(e) => setNewRestData({ ...newRestData, zipCode: e.target.value })}
                      placeholder="01000-000"
                      className="w-1/3 text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo *</label>
                  <input
                    type="text"
                    required
                    value={newRestData.address}
                    onChange={(e) => setNewRestData({ ...newRestData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Comissão da Plataforma (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newRestData.commissionRate}
                    onChange={(e) => setNewRestData({ ...newRestData, commissionRate: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Inicial</label>
                  <select
                    value={newRestData.status}
                    onChange={(e) => setNewRestData({ ...newRestData, status: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="Ativo">Ativo (Pronto para vendas)</option>
                    <option value="Pendente">Pendente (Aguardando homologação)</option>
                    <option value="Em análise">Em análise</option>
                  </select>
                </div>
              </div>

              {/* Theme highlight card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1">
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: newRestData.theme.primaryColor }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: newRestData.theme.secondaryColor }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Tema selecionado: {THEME_PRESETS.find((p) => p.key === newRestData.theme.presetKey)?.name || 'Customizado'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Primária: {newRestData.theme.primaryColor} • Secundária: {newRestData.theme.secondaryColor}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateTab('theme')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Personalizar Cores do App →</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Visual Identity & Store Theme */}
          {createTab === 'theme' && (
            <div className="space-y-4">
              <StoreThemePicker
                theme={newRestData.theme}
                onChange={(theme) => setNewRestData((prev) => ({ ...prev, theme }))}
                restaurantName={newRestData.name || 'Nova Loja'}
                categoryName={newRestData.category}
                logoUrl={newRestData.logo}
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {createTab === 'theme' ? (
              <button
                type="button"
                onClick={() => setCreateTab('info')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ← Voltar aos Dados Cadastrais
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreateTab('info');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {createTab === 'info' && (
                <button
                  type="button"
                  onClick={() => setCreateTab('theme')}
                  className="px-4 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl transition-colors"
                >
                  Personalizar Cores →
                </button>
              )}
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCreating ? 'Salvando no Banco...' : 'Salvar Estabelecimento'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog with justification for approval, rejection or suspension */}
      <ConfirmDialog
        isOpen={!!targetRestaurant && !!actionType}
        onClose={() => {
          setTargetRestaurant(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmStatusChange}
        title={
          actionType === 'approve'
            ? 'Aprovar Estabelecimento'
            : actionType === 'reject'
            ? 'Reprovar Estabelecimento'
            : actionType === 'suspend'
            ? 'Suspender Estabelecimento'
            : 'Reativar Estabelecimento'
        }
        message={
          actionType === 'approve'
            ? `Tem certeza que deseja aprovar o cadastro de "${targetRestaurant?.name}"? Ele ficará ativo e apto a receber pedidos.`
            : actionType === 'reject'
            ? `Deseja reprovar o estabelecimento "${targetRestaurant?.name}"? Informe o motivo abaixo para registro em auditoria.`
            : actionType === 'suspend'
            ? `Deseja suspender temporariamente "${targetRestaurant?.name}"? O cardápio ficará invisível aos clientes.`
            : `Deseja reativar "${targetRestaurant?.name}"?`
        }
        variant={actionType === 'reject' || actionType === 'suspend' ? 'danger' : 'primary'}
        requireReason={actionType === 'reject' || actionType === 'suspend'}
        reasonValue={actionJustification}
        onReasonChange={setActionJustification}
        reasonPlaceholder="Informe a justificativa desta ação administrativa..."
        confirmText={
          actionType === 'approve'
            ? 'Aprovar Cadastro'
            : actionType === 'reject'
            ? 'Reprovar'
            : actionType === 'suspend'
            ? 'Confirmar Suspensão'
            : 'Reativar'
        }
      />

      {/* Store Links Modal */}
      {selectedLinksRestaurant && (
        <StoreLinksModal
          isOpen={!!selectedLinksRestaurant}
          onClose={() => setSelectedLinksRestaurant(null)}
          restaurant={selectedLinksRestaurant}
          onUpdated={refreshList}
        />
      )}

      {/* Quick Commission Edit Modal (PATCH /api/v1/admin/restaurants/{id}/commission) */}
      <Modal
        isOpen={!!commissionTarget}
        onClose={() => setCommissionTarget(null)}
        title="Configurar Alíquota de Comissão"
        subtitle={`Defina as taxas personalizadas para "${commissionTarget?.name}"`}
      >
        <form onSubmit={handleSaveCommission} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <p className="font-bold">Ajuste Contratual de Comissão</p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              Esta alteração incidirá diretamente sobre os repasses e faturamento dos próximos pedidos realizados neste estabelecimento.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alíquota de Comissão (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 pr-8 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxa Fixa por Pedido (R$) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={commissionFixedInput}
                  onChange={(e) => setCommissionFixedInput(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 pr-8 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa Administrativa
            </label>
            <textarea
              rows={2}
              value={commissionJustification}
              onChange={(e) => setCommissionJustification(e.target.value)}
              placeholder="Ex: Renegociação contratual de exclusividade ou incentivo inicial..."
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCommissionTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingCommission}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSavingCommission ? 'Salvando...' : 'Salvar Alíquota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lateral Inspection Drawer (Checklist Item 2) */}
      {drawerRestaurant && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <img
                  src={drawerRestaurant.logo}
                  alt={drawerRestaurant.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {drawerRestaurant.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusBadgeVariant(drawerRestaurant.status)} dot>
                      {drawerRestaurant.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {drawerRestaurant.category}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerRestaurant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Quick Actions Bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-2">
              {(drawerRestaurant.status === 'Pendente' || drawerRestaurant.status === 'PENDING' || drawerRestaurant.status === 'Em análise') && (
                <>
                  <button
                    onClick={() => {
                      setTargetRestaurant(drawerRestaurant);
                      setActionType('approve');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Aprovar Loja</span>
                  </button>
                  <button
                    onClick={() => {
                      setTargetRestaurant(drawerRestaurant);
                      setActionType('reject');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reprovar</span>
                  </button>
                </>
              )}

              {(drawerRestaurant.status === 'Ativo' || drawerRestaurant.status === 'ACTIVE') && (
                <button
                  onClick={() => {
                    setTargetRestaurant(drawerRestaurant);
                    setActionType('suspend');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>Suspender Loja</span>
                </button>
              )}

              {(drawerRestaurant.status === 'Suspenso' || drawerRestaurant.status === 'SUSPENDED') && (
                <button
                  onClick={() => {
                    setTargetRestaurant(drawerRestaurant);
                    setActionType('activate');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Reativar Loja</span>
                </button>
              )}

              <button
                onClick={() => handleOpenCommissionModal(drawerRestaurant)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="Configurar Comissão"
              >
                <span>% Comissão</span>
              </button>
            </div>

            {/* Drawer Body: Inspection Details */}
            <div className="p-5 space-y-5 text-xs text-slate-700 flex-1">
              {/* Documentos & Dados Cadastrais */}
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                  Documentação & Dados Cadastrais
                </h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">CNPJ:</span>
                    <span className="font-mono font-bold text-slate-800">{drawerRestaurant.cnpj}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Responsável:</span>
                    <span className="font-semibold text-slate-800">{drawerRestaurant.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telefone / WhatsApp:</span>
                    <span className="font-medium text-slate-800">{drawerRestaurant.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="font-medium text-slate-800">{drawerRestaurant.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Localização:</span>
                    <span className="font-medium text-slate-800">{drawerRestaurant.city} - {drawerRestaurant.state}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 text-slate-500">
                    <span className="block text-[10px] text-slate-400">Endereço Completo:</span>
                    <span className="font-medium text-slate-700">
                      {typeof drawerRestaurant.address === 'string' ? drawerRestaurant.address : ''} (CEP: {drawerRestaurant.zipCode})
                    </span>
                  </div>
                </div>
              </div>

              {/* Condições Comerciais */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                    Condições Comerciais
                  </h3>
                  <button
                    onClick={() => handleOpenCommissionModal(drawerRestaurant)}
                    className="text-[11px] font-bold text-orange-600 hover:underline"
                  >
                    Editar Taxas
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Comissão Plataforma</span>
                    <span className="text-base font-extrabold text-orange-600">
                      {drawerRestaurant.commissionRate}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Taxa Fixa / Pedido</span>
                    <span className="text-base font-extrabold text-slate-800">
                      R$ {drawerRestaurant.fixedFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pedido Mínimo</span>
                    <span className="text-sm font-bold text-slate-800">
                      R$ {drawerRestaurant.minimumOrder.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tempo de Entrega</span>
                    <span className="text-sm font-bold text-slate-800">
                      {drawerRestaurant.deliveryTimeMin}-{drawerRestaurant.deliveryTimeMax} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Links Dedicados & Identidade */}
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-400">
                  Links & Identidade Visual
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Link App:</span>
                    <span className="font-mono text-orange-600 font-bold">/{drawerRestaurant.slug}-app</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Painel Parceiro:</span>
                    <span className="font-mono text-slate-800 font-bold">/{drawerRestaurant.slug}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Cores da Loja:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: drawerRestaurant.theme?.primaryColor || '#FF6600' }}
                        title={`Primária: ${drawerRestaurant.theme?.primaryColor || '#FF6600'}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: drawerRestaurant.theme?.secondaryColor || '#E63946' }}
                        title={`Secundária: ${drawerRestaurant.theme?.secondaryColor || '#E63946'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setDrawerRestaurant(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Fechar Drawer
              </button>
              <button
                onClick={() => {
                  const id = drawerRestaurant.id;
                  setDrawerRestaurant(null);
                  onViewDetails(id);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
              >
                Ver Ficha Cadastral Completa →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
