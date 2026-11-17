import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  Edit2,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import type { Customer, Order } from '../types';

interface CustomersProps {
  onViewOrder: (orderId: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({ onViewOrder }) => {
  const { currentUser } = useAuth();
  const { success } = useToast();

  const [customers, setCustomers] = useState<Customer[]>(customerService.getAll());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '' });

  const refreshList = () => {
    setCustomers(customerService.getAll());
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders(orderService.getByCustomerId(customer.id));
  };

  const handleToggleStatus = (customer: Customer) => {
    customerService.toggleStatus(customer.id, currentUser);
    success(`Status do cliente ${customer.name} alterado com sucesso!`);
    refreshList();
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(customerService.getById(customer.id) || null);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({ name: customer.name, email: customer.email, phone: customer.phone });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    customerService.update(selectedCustomer.id, editFormData, currentUser);
    success(`Dados de ${editFormData.name} atualizados com sucesso!`);
    setIsEditOpen(false);
    refreshList();
    setSelectedCustomer(customerService.getById(selectedCustomer.id) || null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Consumidores
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {customers.length} clientes cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administração de perfis de consumidores, endereços de entrega e histórico de compras.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
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
            placeholder="Buscar consumidor por nome, e-mail ou telefone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Consumidor</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4">Data de Cadastro</th>
                <th className="py-3 px-4">Pedidos Realizados</th>
                <th className="py-3 px-4">Total Gasto</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span
                        onClick={() => handleOpenDetails(c)}
                        className="font-bold text-slate-900 hover:text-orange-600 cursor-pointer"
                      >
                        {c.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{c.phone}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px]">
                      {c.totalOrders} pedidos
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    R$ {c.totalSpent.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={c.status === 'Ativo' ? 'success' : 'neutral'} dot>
                      {c.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        title="Ver perfil completo e endereços"
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        title="Editar informações"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        title={c.status === 'Ativo' ? 'Desativar consumidor' : 'Ativar consumidor'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.status === 'Ativo'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c.status === 'Ativo' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum consumidor encontrado.
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

      {/* Customer Profile & Addresses Modal */}
      {selectedCustomer && !isEditOpen && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Perfil do Consumidor: ${selectedCustomer.name}`}
          subtitle={`Cadastro realizado em ${new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 font-medium">Status</span>
                <p className="mt-0.5">
                  <Badge variant={selectedCustomer.status === 'Ativo' ? 'success' : 'neutral'} dot>
                    {selectedCustomer.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Pedidos Totais</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.totalOrders} pedidos</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Gasto Acumulado</span>
                <p className="font-bold text-emerald-600 mt-0.5">R$ {selectedCustomer.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" /> Endereços Cadastrados
              </h4>
              <div className="space-y-2">
                {selectedCustomer.addresses.map((addr) => (
                  <div key={addr.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{addr.title}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{addr.street}, {addr.neighborhood}</p>
                    <p className="text-slate-400 text-[11px]">{addr.city} - {addr.state} (CEP: {addr.zipCode})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-orange-600" /> Histórico de Pedidos Recentes
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {customerOrders.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedCustomer(null);
                      onViewOrder(o.id);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-orange-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{o.code} • {o.restaurantName}</p>
                      <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">R$ {o.totalAmount.toFixed(2)}</p>
                      <Badge variant={o.status === 'Entregue' ? 'success' : o.status === 'Cancelado' ? 'danger' : 'warning'} size="sm">
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Customer Info Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Dados do Consumidor"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
            <input
              type="email"
              required
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone *</label>
            <input
              type="text"
              required
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Salvar Dados
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
