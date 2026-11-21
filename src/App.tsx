import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Sidebar, type ActivePage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Pages
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Establishments } from './pages/Establishments';
import { EstablishmentDetail } from './pages/EstablishmentDetail';
import { Customers } from './pages/Customers';
import { AdminUsersPage } from './pages/AdminUsers';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { CategoriesPage } from './pages/Categories';
import { ProductsPage } from './pages/Products';
import { FinancialPage } from './pages/Financial';
import { PromotionsPage } from './pages/Promotions';
import { ReviewsPage } from './pages/Reviews';
import { SupportPage } from './pages/Support';
import { ReportsPage } from './pages/Reports';
import { AuditPage } from './pages/Audit';
import { SettingsPage } from './pages/Settings';

const MainLayout: React.FC = () => {
  const { isLoggedIn } = useAuth();

  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Sub-detail states
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const handleNavigate = (page: ActivePage, itemId?: string) => {
    setActivePage(page);
    if (page === 'restaurants' && itemId) {
      setSelectedRestaurantId(itemId);
    } else {
      setSelectedRestaurantId(null);
    }

    if (page === 'orders' && itemId) {
      setSelectedOrderId(itemId);
    } else {
      setSelectedOrderId(null);
    }
  };

  const handleViewRestaurantDetails = (id: string) => {
    setSelectedRestaurantId(id);
    setActivePage('restaurants');
  };

  const handleViewOrderDetails = (id: string) => {
    setSelectedOrderId(id);
    setActivePage('orders');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => handleNavigate(page)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={(page) => handleNavigate(page)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-70 w-full">
          {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}

          {activePage === 'restaurants' && (
            selectedRestaurantId ? (
              <EstablishmentDetail
                restaurantId={selectedRestaurantId}
                onBack={() => setSelectedRestaurantId(null)}
                onViewOrder={handleViewOrderDetails}
              />
            ) : (
              <Establishments onViewDetails={handleViewRestaurantDetails} />
            )
          )}

          {activePage === 'customers' && <Customers onViewOrder={handleViewOrderDetails} />}

          {activePage === 'admin-users' && <AdminUsersPage />}

          {activePage === 'orders' && (
            selectedOrderId ? (
              <OrderDetail
                orderId={selectedOrderId}
                onBack={() => setSelectedOrderId(null)}
              />
            ) : (
              <Orders onViewOrder={handleViewOrderDetails} />
            )
          )}

          {activePage === 'categories' && <CategoriesPage />}

          {activePage === 'products' && <ProductsPage />}

          {activePage === 'financial' && <FinancialPage />}

          {activePage === 'promotions' && <PromotionsPage />}

          {activePage === 'reviews' && <ReviewsPage onViewOrder={handleViewOrderDetails} />}

          {activePage === 'support' && <SupportPage />}

          {activePage === 'reports' && <ReportsPage />}

          {activePage === 'audit' && <AuditPage />}

          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Search & Command Palette Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
