import React, { useState, useEffect } from 'react';
import { Search, X, Store, ShoppingBag, Users, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { db } from '../../storage/db';
import type { ActivePage } from '../layout/Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: ActivePage, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const term = searchTerm.toLowerCase().trim();

  const restaurants = term
    ? db.getRestaurants().filter((r) => r.name.toLowerCase().includes(term) || r.city.toLowerCase().includes(term)).slice(0, 3)
    : [];

  const orders = term
    ? db.getOrders().filter((o) => o.code.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)).slice(0, 3)
    : [];

  const customers = term
    ? db.getCustomers().filter((c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)).slice(0, 3)
    : [];

  const products = term
    ? db.getProducts().filter((p) => p.name.toLowerCase().includes(term)).slice(0, 3)
    : [];

  const hasResults = restaurants.length > 0 || orders.length > 0 || customers.length > 0 || products.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de pedido, restaurante, cliente ou produto..."
            autoFocus
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!searchTerm && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Digite algo para buscar em tempo real na plataforma Oba Comida.
            </div>
          )}

          {searchTerm && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum resultado encontrado para "{searchTerm}".
            </div>
          )}

          {/* Restaurants */}
          {restaurants.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Estabelecimentos
              </p>
              <div className="space-y-1">
                {restaurants.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onNavigate('restaurants', r.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={r.logo} alt={r.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600">{r.name}</p>
                        <p className="text-[10px] text-slate-500">{r.category} • {r.city}/{r.state}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {orders.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Pedidos
              </p>
              <div className="space-y-1">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onNavigate('orders', o.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600">
                        {o.code} - {o.customerName}
                      </p>
                      <p className="text-[10px] text-slate-500">{o.restaurantName} • R$ {o.totalAmount.toFixed(2)} • {o.status}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {customers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Clientes
              </p>
              <div className="space-y-1">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.email} • {c.phone}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Produtos do Cardápio
              </p>
              <div className="space-y-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.restaurantName} • R$ {p.price.toFixed(2)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
