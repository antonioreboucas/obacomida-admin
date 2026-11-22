import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Edit,
  History,
  ShoppingBag,
  Percent,
  Sliders,
  Palette,
  Check,
  Globe,
  Copy,
  Smartphone,
  LayoutDashboard,
} from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { financialService } from '../services/financialService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StoreThemePicker } from '../components/restaurant/StoreThemePicker';
import { StoreLinksModal } from '../components/restaurant/StoreLinksModal';
import { THEME_PRESETS, getDefaultThemeForCategory } from '../utils/themePresets';
import {
  getStoreAppUrlDisplay,
  getStorePartnerUrlDisplay,
  getStoreAppUrl,
  getStorePartnerUrl,
} from '../utils/slugUtils';
import type { Restaurant, RestaurantStatus, StoreTheme } from '../types';

interface EstablishmentDetailProps {
  restaurantId: string;
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}

export const EstablishmentDetail: React.FC<EstablishmentDetailProps> = ({
  restaurantId,
  onBack,
  onViewOrder,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | undefined>(() =>
    restaurantService.getById(restaurantId)
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'financial' | 'reviews' | 'history' | 'theme'>('overview');

  const [currentTheme, setCurrentTheme] = useState<StoreTheme>(() =>
    restaurant?.theme || getDefaultThemeForCategory(restaurant?.category || 'Restaurantes')
  );

  // Links Modal
  const [isLinksOpen, setIsLinksOpen] = useState(false);

  // Edit commission modal
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(restaurant?.commissionRate || 12.0);
  const [newFixedFee, setNewFixedFee] = useState(restaurant?.fixedFee || 1.5);
  const [commissionJustification, setCommissionJustification] = useState('');

  // Status Action Modal
  const [actionType, setActionType] = useState<'approve' | 'suspend' | 'activate' | null>(null);
  const [actionJustification, setActionJustification] = useState('');

  const refreshRestaurant = async () => {
    try {
      const live = await restaurantService.fetchRestaurantById(restaurantId);
      if (live) {
        setRestaurant(live);
        if (live.theme) setCurrentTheme(live.theme);
        return;
      }
    } catch {}
    const updated = restaurantService.getById(restaurantId);
    setRestaurant(updated);
    if (updated?.theme) {
      setCurrentTheme(updated.theme);
    }
  };

  React.useEffect(() => {
    refreshRestaurant();
  }, [restaurantId]);

  const orders = useMemo(() => {
    return orderService.getByRestaurantId(restaurantId);
  }, [restaurantId]);

  const reviews = useMemo(() => {
    return reviewService.getByRestaurantId(restaurantId);
  }, [restaurantId]);

  const financialRecords = useMemo(() => {
    return financialService.getByRestaurantId(restaurantId);
  }, [restaurantId]);

  const financialSummary = useMemo(() => {
    return financialService.getSummary(restaurantId);
  }, [restaurantId]);

  if (!restaurant) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Estabelecimento não encontrado.</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-orange-600 hover:underline">
          ← Voltar para listagem
        </button>
      </div>
    );
  }

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

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionJustification.trim()) {
      error('Informe a justificativa para alteração de taxa.');
      return;
    }

    restaurantService.updateCommission(
      restaurant.id,
      Number(newCommissionRate),
      Number(newFixedFee),
      currentUser,
      commissionJustification
    );

    success('Taxas e comissões atualizadas com sucesso!');
    setIsCommissionOpen(false);
    setCommissionJustification('');
    refreshRestaurant();
  };

  const handleConfirmStatusChange = async () => {
    if (!actionType || !restaurant) return;

    if (actionType === 'approve') {
      await restaurantService.updateStatusApi(restaurant.id, 'APPROVED', currentUser, actionJustification);
      success(`Estabelecimento "${restaurant.name}" aprovado.`);
    } else if (actionType === 'suspend') {
      await restaurantService.updateStatusApi(restaurant.id, 'SUSPENDED', currentUser, actionJustification);
      success(`Estabelecimento "${restaurant.name}" suspenso.`);
    } else if (actionType === 'activate') {
      await restaurantService.updateStatusApi(restaurant.id, 'ACTIVE', currentUser, actionJustification);
      success(`Estabelecimento "${restaurant.name}" reativado.`);
    }

    setActionType(null);
    setActionJustification('');
    await refreshRestaurant();
  };

  const handleSaveTheme = async () => {
    if (!restaurant) return;
    await restaurantService.updateThemeApi(restaurant.id, currentTheme, currentUser);
    success(`Identidade visual e cores do app atualizadas para "${restaurant.name}"!`);
    await refreshRestaurant();
  };

  return (
    <div className="space-y-6">
      {/* Back button & top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Estabelecimentos</span>
        </button>

        <div className="flex items-center gap-2">
          {restaurant.status === 'Ativo' ? (
            <button
              onClick={() => setActionType('suspend')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl border border-amber-200 text-xs font-bold transition-colors"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Suspender Restaurante</span>
            </button>
          ) : restaurant.status === 'Suspenso' ? (
            <button
              onClick={() => setActionType('activate')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-xs font-bold transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Reativar Restaurante</span>
            </button>
          ) : (
            <button
              onClick={() => setActionType('approve')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Aprovar Cadastro</span>
            </button>
          )}

          <button
            onClick={() => setIsLinksOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold transition-colors"
            title="Ver links exclusivos do App e do Painel Parceiro"
          >
            <Globe className="w-4 h-4 text-orange-600" />
            <span>Links da Loja</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              activeTab === 'theme'
                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            <Palette className={`w-4 h-4 ${activeTab === 'theme' ? 'text-white' : 'text-orange-600'}`} />
            <span>Cores da Loja (App)</span>
          </button>

          <button
            onClick={() => setIsCommissionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold transition-colors"
          >
            <Sliders className="w-4 h-4 text-orange-600" />
            <span>Editar Comissões</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Dynamic Multi-Tenant Brand Accent Stripe */}
        <div
          className="h-2 w-full transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, ${restaurant.theme?.primaryColor || '#FF6600'} 0%, ${restaurant.theme?.secondaryColor || '#E63946'} 100%)`,
          }}
        />

        {restaurant.coverImage && (
          <div className="h-40 w-full relative">
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg bg-white shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{restaurant.name}</h1>
                  <Badge variant={getStatusBadgeVariant(restaurant.status)} dot>
                    {restaurant.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {restaurant.category} • CNPJ: {restaurant.cnpj}
                </p>

                {/* Custom Links Bar */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsLinksOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="Clique para ver detalhes do Aplicativo"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                    <span>{getStoreAppUrlDisplay(restaurant.slug)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLinksOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="Clique para ver detalhes do Painel Parceiro"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
                    <span>{getStorePartnerUrlDisplay(restaurant.slug)}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1 text-slate-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-sm">{restaurant.rating.toFixed(1)}</span>
                <span className="text-slate-400">({reviews.length} avaliações)</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500">Comissão: </span>
                <span className="font-bold text-orange-600">{restaurant.commissionRate}%</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => setActiveTab('theme')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clique para personalizar cores no aplicativo"
              >
                <span className="text-slate-500">Tema do App:</span>
                <div className="flex items-center -space-x-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: restaurant.theme?.primaryColor || '#FF6600' }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: restaurant.theme?.secondaryColor || '#E63946' }}
                  />
                </div>
                <span className="font-bold text-slate-800">
                  {THEME_PRESETS.find((p) => p.key === restaurant.theme?.presetKey)?.name || 'Personalizado'}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral & Cadastro' },
              { id: 'theme', label: '🎨 Cores da Loja no App' },
              { id: 'orders', label: `Pedidos Realizados (${orders.length})` },
              { id: 'financial', label: 'Dados Financeiros & Extrato' },
              { id: 'reviews', label: `Avaliações (${reviews.length})` },
              { id: 'history', label: `Histórico Administrativo (${restaurant.history.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Links e Acessos Exclusivos da Loja */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-orange-50/70 via-white to-slate-50 p-5 rounded-2xl border border-orange-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-600" />
                  Links Oficiais da Loja na Plataforma Oba Comida
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Endereços personalizados para o aplicativo móvel dos clientes e para o portal de gestão do lojista parceiro.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLinksOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Gerenciar Links & QR Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Link */}
              <div className="p-3.5 bg-white rounded-xl border border-orange-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-orange-600" />
                    Aplicativo do Consumidor (App)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Cardápio & Pedidos
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-orange-700">
                  <span className="truncate select-all">{getStoreAppUrlDisplay(restaurant.slug)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getStoreAppUrl(restaurant.slug));
                      success('Link do Aplicativo copiado!');
                    }}
                    className="p-1 hover:bg-white text-slate-600 hover:text-orange-600 rounded transition-colors"
                    title="Copiar link do App"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Acessado pelos clientes para consultar o cardápio e realizar pedidos com a identidade visual da loja.
                </p>
              </div>

              {/* Partner Portal Link */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4 text-slate-700" />
                    Painel do Parceiro (Lojista)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Gestão Operacional
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  <span className="truncate select-all">{getStorePartnerUrlDisplay(restaurant.slug)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getStorePartnerUrl(restaurant.slug));
                      success('Link do Painel Parceiro copiado!');
                    }}
                    className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded transition-colors"
                    title="Copiar link do Painel Parceiro"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Acessado pelo restaurante parceiro para gerenciar pedidos, cardápio e operação.
                </p>
              </div>
            </div>
          </div>

          {/* Informações Cadastrais */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-4 h-4 text-orange-600" /> Informações Cadastrais
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Responsável</span>
                <span className="font-bold text-slate-800">{restaurant.ownerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">CNPJ</span>
                <span className="font-bold text-slate-800">{restaurant.cnpj}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Telefone</span>
                <span className="font-bold text-slate-800">{restaurant.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">E-mail</span>
                <span className="font-bold text-slate-800">{restaurant.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Endereço Completo</span>
                <span className="font-bold text-slate-800">
                  {typeof restaurant.address === 'string' ? restaurant.address : ''}, {restaurant.city} - {restaurant.state} (CEP: {restaurant.zipCode})
                </span>
              </div>
            </div>
          </div>

          {/* Regras Operacionais */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-orange-600" /> Parâmetros de Operação
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Tempo Estimado de Entrega</span>
                <span className="font-bold text-slate-800">
                  {restaurant.deliveryTimeMin} a {restaurant.deliveryTimeMax} minutos
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Pedido Mínimo</span>
                <span className="font-bold text-slate-800">R$ {restaurant.minimumOrder.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Taxa de Entrega Padrão</span>
                <span className="font-bold text-slate-800">R$ {restaurant.deliveryFee.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status de Abertura</span>
                <span className={`font-bold ${restaurant.isOpen ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {restaurant.isOpen ? 'Loja Aberta' : 'Loja Fechada'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Comissão da Plataforma</span>
                <span className="font-bold text-orange-600">{restaurant.commissionRate}%</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Taxa Fixa por Pedido</span>
                <span className="font-bold text-slate-800">R$ {restaurant.fixedFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Theme Tab */}
      {activeTab === 'theme' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-600" />
                  Identidade Visual e Cores da Loja no Aplicativo
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Multi-Tenant Theming
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Personalize a paleta de cores (primária e secundária) para adequar o app ao segmento do estabelecimento (Açaí, Hamburgueria, Restaurante Luxuoso, Pizzaria, etc).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (restaurant.theme) setCurrentTheme(restaurant.theme);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Restaurar Atual
              </button>
              <button
                type="button"
                onClick={handleSaveTheme}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Tema da Loja</span>
              </button>
            </div>
          </div>

          <StoreThemePicker
            theme={currentTheme}
            onChange={setCurrentTheme}
            restaurantName={restaurant.name}
            categoryName={restaurant.category}
            logoUrl={restaurant.logo}
          />
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Histórico de Pedidos Recebidos</h3>
            <span className="text-xs text-slate-500 font-semibold">{orders.length} pedidos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Data/Hora</th>
                  <th className="py-2.5 px-4">Valor Total</th>
                  <th className="py-2.5 px-4">Pagamento</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.slice(0, 15).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-orange-600">{o.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{o.customerName}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">R$ {o.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-600">{o.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <Badge variant={o.status === 'Entregue' ? 'success' : o.status === 'Cancelado' ? 'danger' : 'warning'} dot>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewOrder(o.id)}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Volume Bruto</span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                R$ {financialSummary.grossVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Comissões Oba Comida</span>
              <p className="text-lg font-bold text-orange-600 mt-1">
                R$ {financialSummary.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Repasses Efetuados</span>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                R$ {financialSummary.paidPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Repasses Pendentes</span>
              <p className="text-lg font-bold text-amber-600 mt-1">
                R$ {financialSummary.pendingPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Extrato Simulado */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Extrato Fictício de Repasses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Pedido</th>
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4">Valor Bruto</th>
                    <th className="py-2.5 px-4">Comissão ({restaurant.commissionRate}%)</th>
                    <th className="py-2.5 px-4">Taxas</th>
                    <th className="py-2.5 px-4">Líquido Estabelecimento</th>
                    <th className="py-2.5 px-4">Status Repasse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {financialRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-orange-600">{rec.orderCode}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">R$ {rec.grossAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-rose-600">- R$ {rec.commissionAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-500">- R$ {rec.serviceFee.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">R$ {rec.netAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={rec.payoutStatus === 'Pago' ? 'success' : rec.payoutStatus === 'Processado' ? 'info' : 'warning'}
                          dot
                        >
                          {rec.payoutStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {financialRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhum registro de repasse gerado até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Avaliações dos Consumidores</h3>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                    <span className="text-[10px] text-slate-400">• Pedido {rev.orderCode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{new Date(rev.createdAt).toLocaleString('pt-BR')}</span>
                  {rev.reported && (
                    <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                      Denunciada pelo estabelecimento
                    </span>
                  )}
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma avaliação registrada ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-orange-600" /> Linha do Tempo e Histórico Administrativo
          </h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {restaurant.history.map((hist, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-orange-600 ring-4 ring-white" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{hist.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Responsável: <strong className="text-slate-700">{hist.adminName}</strong> •{' '}
                    {new Date(hist.date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      <Modal
        isOpen={isCommissionOpen}
        onClose={() => setIsCommissionOpen(false)}
        title="Configurar Comissão do Estabelecimento"
        subtitle={`Defina taxas personalizadas para ${restaurant.name}`}
      >
        <form onSubmit={handleSaveCommission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comissão da Plataforma (%) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={newCommissionRate}
              onChange={(e) => setNewCommissionRate(Number(e.target.value))}
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
              value={newFixedFee}
              onChange={(e) => setNewFixedFee(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa Administrativa *
            </label>
            <textarea
              required
              rows={3}
              value={commissionJustification}
              onChange={(e) => setCommissionJustification(e.target.value)}
              placeholder="Ex: Acordo comercial de inauguração ou volume diferenciado de pedidos..."
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCommissionOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmStatusChange}
        title={
          actionType === 'approve'
            ? 'Aprovar Cadastro'
            : actionType === 'suspend'
            ? 'Suspender Restaurante'
            : 'Reativar Restaurante'
        }
        message={
          actionType === 'suspend'
            ? 'Informe a justificativa para suspender o estabelecimento.'
            : `Confirma a ação de ${actionType} para ${restaurant.name}?`
        }
        variant={actionType === 'suspend' ? 'danger' : 'primary'}
        requireReason={actionType === 'suspend'}
        reasonValue={actionJustification}
        onReasonChange={setActionJustification}
        confirmText="Confirmar"
      />

      {/* Store Links Modal */}
      <StoreLinksModal
        isOpen={isLinksOpen}
        onClose={() => setIsLinksOpen(false)}
        restaurant={restaurant}
        onUpdated={refreshRestaurant}
      />
    </div>
  );
};
