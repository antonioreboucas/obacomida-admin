import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import type { AdminUser, AdminRole } from '../types';

export const AdminUsersPage: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const { success, error, info } = useToast();

  const [users, setUsers] = useState<AdminUser[]>(adminService.getAll());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'operator' as AdminRole,
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const refreshList = () => {
    setUsers(adminService.getAll());
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      error('Preencha os campos obrigatórios.');
      return;
    }

    adminService.create(newUser, currentUser);
    success(`Usuário ${newUser.name} cadastrado com sucesso!`);
    setIsCreateOpen(false);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'operator',
      status: 'Ativo',
    });
    refreshList();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    adminService.update(
      editingUser.id,
      {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        department: editingUser.department,
        role: editingUser.role,
        status: editingUser.status,
      },
      currentUser
    );

    success(`Usuário ${editingUser.name} atualizado com sucesso!`);
    setIsEditOpen(false);
    setEditingUser(null);
    refreshList();
  };

  const handleToggleStatus = (u: AdminUser) => {
    if (u.id === currentUser.id) {
      error('Você não pode desativar o seu próprio usuário logado.');
      return;
    }
    adminService.toggleStatus(u.id, currentUser);
    info(`Status de ${u.name} alterado.`);
    refreshList();
  };

  const roleBadgeVariants: Record<AdminRole, any> = {
    superadmin: 'purple',
    admin: 'info',
    operator: 'warning',
    financial: 'success',
  };

  const roleLabels: Record<AdminRole, string> = {
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    operator: 'Operador',
    financial: 'Financeiro',
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Usuários Administrativos
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {users.length} usuários
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de acessos internos com perfis de permissão (Superadministrador, Administrador, Operador e Financeiro).
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário Administrativo</span>
        </button>
      </div>

      {/* Roles Explanatory Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminService.getRoles().map((r) => (
          <div key={r.role} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{r.label}</span>
              <Badge variant={roleBadgeVariants[r.role]} size="sm">
                {r.role}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Filter and Table */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou departamento..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
        >
          <option value="all">Todos os Níveis de Acesso</option>
          <option value="superadmin">Superadministrador</option>
          <option value="admin">Administrador</option>
          <option value="operator">Operador</option>
          <option value="financial">Financeiro</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Perfil de Acesso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={u.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{u.department}</td>

                  <td className="py-3.5 px-4">
                    <Badge variant={roleBadgeVariants[u.role]}>
                      {roleLabels[u.role]}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={u.status === 'Ativo' ? 'success' : 'neutral'} dot>
                      {u.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(u.lastLogin).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setIsEditOpen(true);
                        }}
                        title="Editar perfil do usuário"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.id === currentUser.id}
                        title={u.status === 'Ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          u.status === 'Ativo' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'Ativo' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Cadastrar Usuário Administrativo"
        subtitle="Adicione um novo operador, analista ou administrador interno"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="(11) 98888-7777"
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
              <input
                type="text"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                placeholder="Ex: Operações / SAC"
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Acesso *</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as AdminRole })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="operator">Operador (Atendimento e Pedidos)</option>
              <option value="financial">Financeiro (Taxas, Faturamento e Repasses)</option>
              <option value="admin">Administrador (Gestão Operacional Ampla)</option>
              <option value="superadmin">Superadministrador (Acesso Irrestrito)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Cadastrar Usuário
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Editar Usuário: ${editingUser.name}`}
        >
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Acesso</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AdminRole })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="operator">Operador</option>
                  <option value="financial">Financeiro</option>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Superadministrador</option>
                </select>
              </div>
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
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
