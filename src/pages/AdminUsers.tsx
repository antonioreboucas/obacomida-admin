import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { adminService, type AdminUserCreatePayload } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import type { AdminUser } from '../types';

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState<AdminUserCreatePayload>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ADMIN',
    is_active: true,
  });

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Role Assignment Modal (Checklist Item 4)
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');
  const [isSavingRole, setIsSavingRole] = useState(false);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.fetchUsers(
        searchTerm,
        roleFilter,
        currentPage,
        itemsPerPage
      );
      setUsers(res.items);
      setTotalUsers(res.total);
    } catch (err) {
      console.warn('Erro ao buscar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || newUser.name.trim().length < 2) {
      error('O nome deve ter no mínimo 2 caracteres.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email.trim())) {
      error('Informe um endereço de e-mail válido.');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      error('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await adminService.createAdminUser(
        {
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          phone: newUser.phone?.trim() || undefined,
          role: newUser.role,
          is_active: newUser.is_active,
        },
        currentUser
      );
      success(`Usuário ${created.name} cadastrado com sucesso!`);
      setIsCreateOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'ADMIN',
        is_active: true,
      });
      refreshList();
    } catch (err: any) {
      error('Falha ao cadastrar usuário:', err.message || 'Erro inesperado na API.');
    } finally {
      setIsCreating(false);
    }
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

  // Status / Block toggle via PATCH /admin/users/{user_id}/status
  const handleToggleBlock = async (u: AdminUser) => {
    if (u.id === currentUser.id) {
      error('Você não pode alterar o status do seu próprio usuário logado.');
      return;
    }

    const isCurrentlyActive = !u.is_blocked && u.status === 'Ativo' && u.is_active !== false;
    const nextActive = !isCurrentlyActive;

    try {
      await adminService.updateUserStatus(u.id, nextActive, currentUser);
      if (nextActive) {
        success(`Conta de ${u.name} ativada com sucesso!`);
      } else {
        info(`Conta de ${u.name} desativada / bloqueada.`);
      }
      refreshList();
    } catch (err: any) {
      error('Falha ao atualizar status do usuário:', err.message);
    }
  };

  // Role Assignment via API
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;

    setIsSavingRole(true);
    try {
      await adminService.assignRole(roleModalUser.id, selectedRole, currentUser);
      success(`Perfil de ${roleModalUser.name} atualizado para ${selectedRole}!`);
      setRoleModalUser(null);
      refreshList();
    } catch (err: any) {
      error('Falha ao conceder perfil:', err.message);
    } finally {
      setIsSavingRole(false);
    }
  };

  const roleBadgeVariants: Record<string, any> = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'info',
    PARTNER: 'orange',
    CUSTOMER: 'neutral',
    OPERATOR: 'warning',
    FINANCIAL: 'success',
    superadmin: 'purple',
    admin: 'info',
    operator: 'warning',
    financial: 'success',
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'SUPER_ADMIN (Superadministrador)',
    ADMIN: 'ADMIN (Administrador Oficial)',
    PARTNER: 'PARTNER (Restaurante Parceiro)',
    CUSTOMER: 'CUSTOMER (Consumidor)',
    OPERATOR: 'OPERATOR (Operador de Atendimento)',
    FINANCIAL: 'FINANCIAL (Financeiro & Repasses)',
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    operator: 'Operador',
    financial: 'Financeiro',
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Usuários & Controle de Acesso (RBAC)
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {totalUsers} usuários
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de perfis globais da plataforma (CUSTOMER, PARTNER, ADMIN, SUPER_ADMIN), bloqueio/desbloqueio e concessão de papéis.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Administrador / Colaborador</span>
        </button>
      </div>

      {/* Roles Explanatory Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { role: 'SUPER_ADMIN', label: 'Superadministrador', desc: 'Acesso total irrestrito a configurações globais e sistema.' },
          { role: 'ADMIN', label: 'Administrador', desc: 'Gestão de restaurantes, usuários, pedidos e relatórios.' },
          { role: 'PARTNER', label: 'Parceiro / Restaurante', desc: 'Acesso restrito ao painel da sua loja e cardápio.' },
          { role: 'CUSTOMER', label: 'Consumidor', desc: 'Consumidores cadastrados no aplicativo do ecossistema.' },
        ].map((r) => (
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

      {/* Filter and Table Controls */}
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
            placeholder="Buscar por nome, e-mail ou departamento..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Profile Filter Dropdown (Checklist Item 4) */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
        >
          <option value="all">Todos os Perfis (CUSTOMER, PARTNER, ADMIN)</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN (Superadministrador)</option>
          <option value="ADMIN">ADMIN (Administrador)</option>
          <option value="PARTNER">PARTNER (Restaurante Parceiro)</option>
          <option value="CUSTOMER">CUSTOMER (Consumidor)</option>
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
                <th className="py-3 px-4">Departamento / Origem</th>
                <th className="py-3 px-4">Perfil de Acesso (Role)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => {
                const isBlocked = u.is_blocked || u.status === 'Inativo';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{u.department}</td>

                    <td className="py-3.5 px-4">
                      <Badge variant={roleBadgeVariants[u.role] || 'neutral'}>
                        {roleLabels[u.role] || String(u.role).toUpperCase()}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={isBlocked ? 'danger' : 'success'} dot>
                        {isBlocked ? 'Bloqueado' : 'Ativo'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(u.lastLogin).toLocaleString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Conceder / Alterar Perfil (Modal) */}
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setSelectedRole(String(u.role).toUpperCase());
                          }}
                          title="Atribuir Role / Conceder Permissões (POST /admin/users/{id}/roles)"
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        {/* Bloquear / Desbloquear Usuário */}
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={u.id === currentUser.id}
                          title={isBlocked ? 'Desbloquear usuário (POST /unblock)' : 'Bloquear usuário (POST /block)'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>

                        {/* Editar Dados */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsEditOpen(true);
                          }}
                          title="Editar dados cadastrais"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum usuário encontrado para os filtros selecionados.
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
          totalItems={totalUsers}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Modal de Concessão de Papéis (Checklist Item 4) */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Atribuir Perfil de Acesso (RBAC)"
        subtitle={`Defina o nível de permissão global para ${roleModalUser?.name}`}
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
            <p className="font-bold">Controle de Privilégios</p>
            <p className="mt-0.5 text-[11px] text-purple-700">
              A alteração de role entra em vigor imediatamente após a confirmação. Usuários com papéis ADMIN ou SUPER_ADMIN têm acesso à este painel.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perfil Selecionado (Role Name) *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Acesso Total e Ilimitado)</option>
              <option value="ADMIN">ADMIN (Administrador Central)</option>
              <option value="PARTNER">PARTNER (Lojista / Restaurante Parceiro)</option>
              <option value="CUSTOMER">CUSTOMER (Consumidor Final)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoleModalUser(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingRole}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSavingRole ? 'Atribuindo...' : 'Salvar Perfil (RBAC)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Modal: Novo Administrador / Colaborador (POST /admin/users) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Novo Administrador / Colaborador"
        subtitle="Cadastre um colaborador com credenciais e papel administrativo (POST /admin/users)"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo * <span className="text-[10px] text-slate-400 font-normal">(Mínimo 2 caracteres)</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              placeholder="Ex: Carlos Eduardo Silva"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail de Acesso * <span className="text-[10px] text-slate-400 font-normal">(Formato de e-mail válido)</span>
            </label>
            <input
              type="email"
              required
              placeholder="colaborador@obacomida.com.br"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha Inicial * <span className="text-[10px] text-slate-400 font-normal">(Mín. 6 caracteres)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="(11) 98888-7777"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Papel / Perfil de Acesso (Role) *
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
              className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
            >
              <option value="ADMIN">ADMIN — Administrador Geral</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN — Superadministrador (Acesso Total)</option>
              <option value="OPERATOR">OPERATOR — Operador de Atendimento / Pedidos</option>
              <option value="FINANCIAL">FINANCIAL — Analista Financeiro & Repasses</option>
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newUser.is_active}
                onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                Conta Ativa <span className="text-[10px] text-slate-400 font-normal">(Usuário poderá realizar login imediatamente)</span>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCreating ? 'Cadastrando na API...' : 'Cadastrar Administrador'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Usuário"
        subtitle="Atualize os dados e departamento do usuário"
      >
        {editingUser && (
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
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
        )}
      </Modal>
    </div>
  );
};
