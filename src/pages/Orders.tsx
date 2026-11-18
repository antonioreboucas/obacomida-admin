import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  XCircle,
  Loader2,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { restaurantService } from '../services/restaurantService';
import { isMockEnabled } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import type { Order, OrderStatus, PaymentMethod, Restaurant } from '../types';

interface OrdersProps {
  onViewOrder: (orderId: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ onViewOrder }) => {
  const { currentUser } = useAuth();
  const { success } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orderData, restData] = await Promise.all([
        orderService.fetchAdminOrders({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          restaurant_id: restaurantFilter !== 'all' ? restaurantFilter : undefined,
        }),
        restaurantService.fetchAdminRestaurants(),
      ]);
      setOrders(orderData);
      setRestaurants(restData);
    } catch (err) {
      console.warn('Erro ao carregar pedidos:', err);
      if (isMockEnabled()) {
        setOrders(orderService.getAll());
        setRestaurants(restaurantService.getAll());
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, restaurantFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchRest = restaurantFilter === 'all' || o.restaurantId === restaurantFilter;
      const matchCity = cityFilter === 'all' || o.city === cityFilter;
      const matchPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;

      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = o.createdAt.startsWith('2026-11-16');
      } else if (dateFilter === 'yesterday') {
        matchDate = o.createdAt.startsWith('2026-11-15');
      }

      return matchSearch && matchStatus && matchRest && matchCity && matchPayment && matchDate;
    });
  }, [orders, searchTerm, statusFilter, restaurantFilter, cityFilter, paymentFilter, dateFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusBadgeVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'Entregue':
        return 'success';
      case 'Saiu para entrega':
        return 'info';
      case 'Em preparação':
        return 'warning';
      case 'Confirmado':
        return 'purple';
      case 'Criado':
        return 'primary';
      case 'Cancelado':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Central de Gestão de Pedidos
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {orders.length} pedidos registrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoramento de status em tempo real, intervenção administrativa e histórico de entregas.
          </p>
        </div>

        {/* Quick status tabs summary */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              statusFilter === 'all' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              setStatusFilter('Em preparação');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              statusFilter === 'Em preparação' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Em Preparo
          </button>
          <button
            onClick={() => {
              setStatusFilter('Saiu para entrega');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              statusFilter === 'Saiu para entrega' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Em Rota
          </button>
          <button
            onClick={() => {
              setStatusFilter('Cancelado');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl border transition-colors ${
              statusFilter === 'Cancelado' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código (#OBA-...), cliente ou restaurante..."
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
              <option value="all">Status: Todos</option>
              <option value="Criado">Criado</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Em preparação">Em preparação</option>
              <option value="Saiu para entrega">Saiu para entrega</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Restaurant Filter */}
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

          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Pagamento: Todos</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Vale Refeição">Vale Refeição</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all">Cidades: Todas</option>
              <option value="São Paulo">São Paulo</option>
              <option value="Rio de Janeiro">Rio de Janeiro</option>
              <option value="Belo Horizonte">Belo Horizonte</option>
              <option value="Curitiba">Curitiba</option>
              <option value="Campinas">Campinas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Data e Horário</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
                    <span>Carregando pedidos da API (/admin/orders)...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-orange-600">
                      <button
                        onClick={() => onViewOrder(o.id)}
                        className="hover:underline font-mono"
                      >
                        {o.code}
                      </button>
                      {o.occurrences.length > 0 && (
                        <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                          ⚠️ {o.occurrences.length} ocorrência(s)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{o.customerName}</p>
                      <p className="text-[10px] text-slate-400">{o.city}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{o.restaurantName}</p>
                      <p className="text-[10px] text-slate-400">{o.items.length} item(ns)</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      R$ {o.totalAmount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        {o.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-[11px] font-medium">{o.deliveryType}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(o.status)} dot>
                        {o.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewOrder(o.id)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Ver detalhes completos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
