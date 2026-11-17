import React, { useState, useMemo } from 'react';
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
import { getDefaultThemeForCategory, THEME_PRESETS } from '../utils/themePresets';
import type { Restaurant, RestaurantStatus } from '../types';

interface EstablishmentsProps {
  onViewDetails: (restaurantId: string) => void;
}

export const Establishments: React.FC<EstablishmentsProps> = ({ onViewDetails }) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>(restaurantService.getAll());
  const categories = categoryService.getAll();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Status Action Modal
  const [targetRestaurant, setTargetRestaurant] = useState<Restaurant | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'activate' | null>(null);
  const [actionJustification, setActionJustification] = useState('');

  // Register New Restaurant Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'info' | 'theme'>('info');
  const [newRestData, setNewRestData] = useState({
    name: '',
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
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    isOpen: true,
    status: 'Pendente' as RestaurantStatus,
    theme: getDefaultThemeForCategory('Hamburguerias'),
  });

  const refreshList = () => {
    setRestaurants(restaurantService.getAll());
  };

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
        return 'success';
      case 'Aprovado':
        return 'info';
      case 'Pendente':
        return 'warning';
      case 'Em análise':
        return 'purple';
      case 'Suspenso':
        return 'danger';
      case 'Reprovado':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleConfirmStatusChange = () => {
    if (!targetRestaurant || !actionType) return;

    if (actionType === 'approve') {
      restaurantService.approve(targetRestaurant.id, currentUser);
      success(`Restaurante "${targetRestaurant.name}" aprovado com sucesso!`);
    } else if (actionType === 'reject') {
      restaurantService.reject(targetRestaurant.id, currentUser, actionJustification);
      info(`Restaurante "${targetRestaurant.name}" reprovado.`);
    } else if (actionType === 'suspend') {
      restaurantService.suspend(targetRestaurant.id, currentUser, actionJustification);
      info(`Restaurante "${targetRestaurant.name}" suspenso preventivamente.`);
    } else if (actionType === 'activate') {
      restaurantService.activate(targetRestaurant.id, currentUser);
      success(`Restaurante "${targetRestaurant.name}" ativado com sucesso!`);
    }

    setTargetRestaurant(null);
    setActionType(null);
    setActionJustification('');
    refreshList();
  };

  const handleCreateRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestData.name || !newRestData.ownerName || !newRestData.phone || !newRestData.cnpj) {
      error('Preencha os campos obrigatórios.');
      return;
    }

    const catObj = categories.find((c) => c.name === newRestData.category) || categories[0];

    restaurantService.create(
      {
        ...newRestData,
        categoryId: catObj.id,
      },
      currentUser
    );

    success(`Restaurante "${newRestData.name}" cadastrado com sucesso!`);
    setIsCreateOpen(false);
    refreshList();
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
              {paginated.map((r) => (
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
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{r.address}</p>
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
                        onClick={() => onViewDetails(r.id)}
                        title="Personalizar Cores / Ver Detalhes"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Palette className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onViewDetails(r.id)}
                        title="Ver detalhes do estabelecimento"
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
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum estabelecimento encontrado para os filtros selecionados.
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
                    onChange={(e) => setNewRestData({ ...newRestData, name: e.target.value })}
                    placeholder="Ex: Açaí Puro Sabor / Burguer King Prime"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria * <span className="text-[10px] text-orange-600 font-normal">(Sugere paleta de cores automática)</span>
                  </label>
                  <select
                    value={newRestData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setNewRestData((prev) => ({
                        ...prev,
                        category: newCat,
                        theme: getDefaultThemeForCategory(newCat),
                      }));
                    }}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newRestData.city}
                      onChange={(e) => setNewRestData({ ...newRestData, city: e.target.value })}
                      placeholder="Cidade"
                      className="w-3/4 text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newRestData.state}
                      onChange={(e) => setNewRestData({ ...newRestData, state: e.target.value.toUpperCase() })}
                      placeholder="UF"
                      className="w-1/4 text-xs border border-slate-300 rounded-xl p-2.5 text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
              >
                Salvar Estabelecimento
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
    </div>
  );
};
