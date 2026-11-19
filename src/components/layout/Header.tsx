import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Sparkles,
  ChevronDown,
  Building2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isMockEnabled } from '../../services/api';
import { db } from '../../storage/db';
import type { AdminRole } from '../../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenSearch: () => void;
  onNavigate: (page: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenSearch,
  onNavigate,
}) => {
  const { currentUser, switchRole, logout, isApiConnected, apiBaseUrl, checkApiConnection } = useAuth();
  const { info, success } = useToast();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador Oficial',
    PARTNER: 'Parceiro / Lojista',
    CUSTOMER: 'Consumidor',
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    operator: 'Operador',
    financial: 'Financeiro',
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    PARTNER: 'bg-orange-100 text-orange-800 border-orange-200',
    CUSTOMER: 'bg-slate-100 text-slate-800 border-slate-200',
    superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    operator: 'bg-amber-100 text-amber-800 border-amber-200',
    financial: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const handleCheckApi = async () => {
    setIsCheckingApi(true);
    const ok = await checkApiConnection();
    setIsCheckingApi(false);
    if (ok) {
      success('API Conectada!', `Servidor FastAPI respondendo em ${apiBaseUrl}`);
    } else {
      info('API Offline', `Tentativa de conexão com ${apiBaseUrl} não obteve resposta.`);
    }
  };

  // Quick live notifications
  const notifications = [
    { id: 1, title: 'Novo restaurante pendente', desc: 'Tacos & Guacamole aguarda homologação cadastral', time: 'Há 12 min', action: () => onNavigate('restaurants') },
    { id: 2, title: 'Chamado urgente aberto', desc: 'Cliente relatou cobrança duplicada (#TK-1002)', time: 'Há 35 min', action: () => onNavigate('support') },
    { id: 3, title: 'Avaliação denunciada', desc: 'Restaurante Sushiman Prime reportou comentário', time: 'Há 1h', action: () => onNavigate('reviews') },
  ];

  const handleResetData = () => {
    if (confirm('Deseja restaurar todos os dados mockados para o padrão inicial do Oba Comida?')) {
      db.resetToDefaults();
      success('Dados restaurados com sucesso!');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:pl-70">
      {/* Left side: Mobile burger & Global Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-400 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/60 rounded-xl transition-all w-48 sm:w-72 text-left group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          <span className="truncate">Pesquisar pedidos, restaurantes...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side: API Status, Role Simulator, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* API Connection Indicator */}
        <button
          onClick={handleCheckApi}
          disabled={isCheckingApi}
          title={`API Base: ${apiBaseUrl} - Clique para testar conexão`}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
            isApiConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isApiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="hidden sm:inline">
            {isCheckingApi ? 'Testando...' : isApiConnected ? 'API Online' : 'API Local'}
          </span>
        </button>

        {/* Mock Controls (Only visible when isMockEnabled() is true) */}
        {isMockEnabled() && (
          <>
            {/* Reset Database Button */}
            <button
              onClick={handleResetData}
              title="Restaurar dados de demonstração aos padrões"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Mock</span>
            </button>

            {/* Role Simulator Selector */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs hover:opacity-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden sm:inline text-slate-600">Simular Perfil:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${roleColors[currentUser.role]}`}>
                  {roleLabels[currentUser.role]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Alternar Nível de Acesso (Mock)
                  </div>

                  {(['superadmin', 'admin', 'operator', 'financial'] as AdminRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setShowRoleDropdown(false);
                        info(`Perfil alternado para ${roleLabels[role]}`);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                        currentUser.role === role ? 'bg-orange-50/80 text-orange-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p>{roleLabels[role]}</p>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {role === 'superadmin' && 'Acesso total irrestrito'}
                          {role === 'admin' && 'Gestão operacional e relatórios'}
                          {role === 'operator' && 'Operação de pedidos e moderação'}
                          {role === 'financial' && 'Faturamento, repasses e taxas'}
                        </span>
                      </div>
                      {currentUser.role === role && <span className="w-2 h-2 rounded-full bg-orange-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notificações da Operação</span>
                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {notifications.length} novas
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      n.action();
                      setShowNotifications(false);
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-orange-500/20"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{currentUser.department}</p>
          </div>

          <button
            onClick={() => {
              logout();
              info('Sessão encerrada', 'Você saiu do painel administrativo.');
            }}
            title="Sair do painel"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
