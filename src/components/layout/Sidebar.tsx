import React from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  ShieldCheck,
  ShoppingBag,
  Layers,
  UtensilsCrossed,
  DollarSign,
  TicketPercent,
  Star,
  LifeBuoy,
  BarChart3,
  History,
  Settings,
  ChevronRight,
  Flame,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../storage/db';

export type ActivePage =
  | 'dashboard'
  | 'restaurants'
  | 'customers'
  | 'admin-users'
  | 'orders'
  | 'categories'
  | 'products'
  | 'financial'
  | 'promotions'
  | 'reviews'
  | 'support'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { hasPermission, currentUser, logout } = useAuth();

  // Badges calculation
  const restaurants = db.getRestaurants();
  const pendingRestaurants = restaurants.filter(
    (r) => r.status === 'Pendente' || r.status === 'Em análise'
  ).length;

  const orders = db.getOrders();
  const activeOrders = orders.filter((o) =>
    ['Criado', 'Confirmado', 'Em preparação', 'Saiu para entrega'].includes(o.status)
  ).length;

  const supportTickets = db.getSupportTickets();
  const openTickets = supportTickets.filter(
    (t) => t.status === 'Aberto' || t.status === 'Em atendimento'
  ).length;

  const reviews = db.getReviews();
  const pendingReviews = reviews.filter((r) => r.moderationStatus === 'pending').length;

  const products = db.getProducts();
  const pendingProducts = products.filter((p) => p.status === 'Em moderação').length;

  const navItems = [
    {
      group: 'Principal',
      items: [
        { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders' as ActivePage, label: 'Pedidos', icon: ShoppingBag, badge: activeOrders, badgeColor: 'bg-orange-500 text-white' },
      ],
    },
    {
      group: 'Marketplace',
      items: [
        { id: 'restaurants' as ActivePage, label: 'Estabelecimentos', icon: Store, badge: pendingRestaurants, badgeColor: 'bg-amber-500 text-white' },
        { id: 'categories' as ActivePage, label: 'Categorias', icon: Layers },
        { id: 'products' as ActivePage, label: 'Produtos', icon: UtensilsCrossed, badge: pendingProducts, badgeColor: 'bg-blue-500 text-white' },
        { id: 'promotions' as ActivePage, label: 'Promoções & Cupons', icon: TicketPercent },
      ],
    },
    {
      group: 'Pessoas & Operação',
      items: [
        { id: 'customers' as ActivePage, label: 'Clientes', icon: Users },
        { id: 'admin-users' as ActivePage, label: 'Usuários Admin', icon: ShieldCheck, restricted: !hasPermission('manage_users') },
        { id: 'reviews' as ActivePage, label: 'Avaliações & Moderação', icon: Star, badge: pendingReviews, badgeColor: 'bg-rose-500 text-white' },
        { id: 'support' as ActivePage, label: 'Suporte', icon: LifeBuoy, badge: openTickets, badgeColor: 'bg-purple-500 text-white' },
      ],
    },
    {
      group: 'Gestão & Controle',
      items: [
        { id: 'financial' as ActivePage, label: 'Financeiro', icon: DollarSign },
        { id: 'reports' as ActivePage, label: 'Relatórios', icon: BarChart3 },
        { id: 'audit' as ActivePage, label: 'Auditoria & Logs', icon: History },
        { id: 'settings' as ActivePage, label: 'Configurações', icon: Settings, restricted: !hasPermission('manage_settings') },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Flame className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">OBA</span>
              <span className="font-medium text-lg text-orange-400">COMIDA</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block -mt-1">
              Painel Admin
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  if (item.restricted) return null;
                  const Icon = item.icon;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                              isActive ? 'bg-white/20 text-white' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* System status & User footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">Marketplace Online</span>
            </div>
            <span className="text-[10px] text-slate-400">MVP v1.0</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-orange-500/30 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight capitalize">{currentUser.role}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sair do painel administrativo"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
