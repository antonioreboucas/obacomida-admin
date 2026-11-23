import {
  initialAdminUsers,
  initialRestaurants,
  initialCustomers,
  initialProducts,
  initialOrders,
  initialCategories,
  initialPromotions,
  initialReviews,
  initialFinancialRecords,
  initialSupportTickets,
  initialAuditLogs,
  initialSettings,
} from '../mock/mockData';
import { generateSlug, getStoreAppUrl, getStorePartnerUrl } from '../utils/slugUtils';
import { isMockEnabled } from '../services/api';
import type {
  AdminUser,
  Restaurant,
  Customer,
  Product,
  Order,
  Category,
  Promotion,
  Review,
  FinancialRecord,
  SupportTicket,
  AuditLog,
  PlatformSettings,
  PartnerAccess,
} from '../types';

const STORAGE_KEYS = {
  ADMIN_USERS: 'obacomida_admin_users',
  RESTAURANTS: 'obacomida_restaurants',
  CUSTOMERS: 'obacomida_customers',
  PRODUCTS: 'obacomida_products',
  ORDERS: 'obacomida_orders',
  CATEGORIES: 'obacomida_categories',
  PROMOTIONS: 'obacomida_promotions',
  REVIEWS: 'obacomida_reviews',
  FINANCIAL: 'obacomida_financial',
  SUPPORT: 'obacomida_support',
  AUDIT: 'obacomida_audit',
  SETTINGS: 'obacomida_settings',
  ACTIVE_USER: 'obacomida_active_user',
  PARTNER_ACCESS: 'obacomida_partner_access',
  VERSION: 'obacomida_db_version_v1',
};

class MockDatabase {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if (!isMockEnabled()) {
      // In real API mode: purge all mock data keys so localStorage does NOT hold fake mock dataset
      const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (currentVersion !== 'real_api_clean_v2') {
        const mockKeys = [
          STORAGE_KEYS.RESTAURANTS,
          STORAGE_KEYS.CATEGORIES,
          STORAGE_KEYS.PRODUCTS,
          STORAGE_KEYS.ORDERS,
          STORAGE_KEYS.CUSTOMERS,
          STORAGE_KEYS.FINANCIAL,
          STORAGE_KEYS.AUDIT,
          STORAGE_KEYS.SUPPORT,
          STORAGE_KEYS.ADMIN_USERS,
        ];
        mockKeys.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(STORAGE_KEYS.VERSION, 'real_api_clean_v2');
      }
      return;
    }

    // Ensure initial starter dataset (establishments, categories, orders) is present only in mock mode
    const existingRest = this.getItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
    if (!existingRest || existingRest.length === 0) {
      this.populateStarterDataset();
    }
  }

  public populateStarterDataset() {
    if (!isMockEnabled()) return;
    this.setItem(STORAGE_KEYS.RESTAURANTS, initialRestaurants);
    this.setItem(STORAGE_KEYS.CATEGORIES, initialCategories);
    this.setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
    this.setItem(STORAGE_KEYS.ORDERS, initialOrders);
    this.setItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    this.setItem(STORAGE_KEYS.FINANCIAL, initialFinancialRecords);
    this.setItem(STORAGE_KEYS.AUDIT, initialAuditLogs);
    this.setItem(STORAGE_KEYS.SUPPORT, initialSupportTickets);
    this.setItem(STORAGE_KEYS.SETTINGS, initialSettings);
    this.setItem(STORAGE_KEYS.ADMIN_USERS, initialAdminUsers);
    localStorage.setItem(STORAGE_KEYS.VERSION, 'starter_dataset_v1');
    this.notify();
  }

  public resetToDefaults() {
    if (!isMockEnabled()) {
      localStorage.removeItem(STORAGE_KEYS.RESTAURANTS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      this.notify();
      return;
    }
    this.populateStarterDataset();
  }

  public clearMockData() {
    this.populateStarterDataset();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Failed to save to localStorage (${key}):`, e);
    }
  }

  // Admin Users
  public getAdminUsers(): AdminUser[] {
    if (!isMockEnabled()) {
      return this.getItem<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, []);
    }
    const list = this.getItem<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, initialAdminUsers);
    return list && list.length > 0 ? list : initialAdminUsers;
  }
  public saveAdminUsers(users: AdminUser[]): void {
    this.setItem(STORAGE_KEYS.ADMIN_USERS, users);
  }

  // Active User / Session
  public getActiveUser(): AdminUser {
    return this.getItem<AdminUser>(STORAGE_KEYS.ACTIVE_USER, initialAdminUsers[0]);
  }
  public setActiveUser(user: AdminUser): void {
    this.setItem(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // Restaurants
  public getRestaurants(): Restaurant[] {
    if (!isMockEnabled()) {
      return this.getItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
    }
    const list = this.getItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, initialRestaurants);
    const validList = list && list.length > 0 ? list : initialRestaurants;
    let hasChanges = false;
    const normalized = validList.map((r) => {
      let slug = r.slug;
      if (!slug) {
        slug = generateSlug(r.name);
        hasChanges = true;
      }
      const appUrl = r.appUrl || getStoreAppUrl(slug);
      const partnerUrl = r.partnerUrl || getStorePartnerUrl(slug);
      if (!r.appUrl || !r.partnerUrl || !r.slug) {
        hasChanges = true;
        return {
          ...r,
          slug,
          appUrl,
          partnerUrl,
        };
      }
      return r;
    });

    if (hasChanges && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(normalized));
      } catch {
        // ignore
      }
    }

    return normalized;
  }
  public saveRestaurants(restaurants: Restaurant[]): void {
    this.setItem(STORAGE_KEYS.RESTAURANTS, restaurants);
  }

  // Customers
  public getCustomers(): Customer[] {
    if (!isMockEnabled()) {
      return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    }
    const list = this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    return list && list.length > 0 ? list : initialCustomers;
  }
  public saveCustomers(customers: Customer[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Products
  public getProducts(): Product[] {
    if (!isMockEnabled()) {
      return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    }
    const list = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
    return list && list.length > 0 ? list : initialProducts;
  }
  public saveProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  // Orders
  public getOrders(): Order[] {
    if (!isMockEnabled()) {
      return this.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    }
    const list = this.getItem<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
    return list && list.length > 0 ? list : initialOrders;
  }
  public saveOrders(orders: Order[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  // Categories
  public getCategories(): Category[] {
    if (!isMockEnabled()) {
      return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    }
    const list = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
    return list && list.length > 0 ? list : initialCategories;
  }
  public saveCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Promotions
  public getPromotions(): Promotion[] {
    if (!isMockEnabled()) {
      return this.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, []);
    }
    const list = this.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, initialPromotions);
    return list && list.length > 0 ? list : initialPromotions;
  }
  public savePromotions(promotions: Promotion[]): void {
    this.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
  }

  // Reviews
  public getReviews(): Review[] {
    if (!isMockEnabled()) {
      return this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, []);
    }
    const list = this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
    return list && list.length > 0 ? list : initialReviews;
  }
  public saveReviews(reviews: Review[]): void {
    this.setItem(STORAGE_KEYS.REVIEWS, reviews);
  }

  // Financial
  public getFinancialRecords(): FinancialRecord[] {
    if (!isMockEnabled()) {
      return this.getItem<FinancialRecord[]>(STORAGE_KEYS.FINANCIAL, []);
    }
    const list = this.getItem<FinancialRecord[]>(STORAGE_KEYS.FINANCIAL, initialFinancialRecords);
    return list && list.length > 0 ? list : initialFinancialRecords;
  }
  public saveFinancialRecords(records: FinancialRecord[]): void {
    this.setItem(STORAGE_KEYS.FINANCIAL, records);
  }

  // Support
  public getSupportTickets(): SupportTicket[] {
    if (!isMockEnabled()) {
      return this.getItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT, []);
    }
    const list = this.getItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT, initialSupportTickets);
    return list && list.length > 0 ? list : initialSupportTickets;
  }
  public saveSupportTickets(tickets: SupportTicket[]): void {
    this.setItem(STORAGE_KEYS.SUPPORT, tickets);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    if (!isMockEnabled()) {
      return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT, []);
    }
    const list = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT, initialAuditLogs);
    return list && list.length > 0 ? list : initialAuditLogs;
  }
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.AUDIT, [newEntry, ...logs]);
  }

  // Settings
  public getSettings(): PlatformSettings {
    return this.getItem<PlatformSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }
  public saveSettings(settings: PlatformSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Partner Access Management
  public getPartnerAccesses(): Record<string, PartnerAccess> {
    return this.getItem<Record<string, PartnerAccess>>(STORAGE_KEYS.PARTNER_ACCESS, {});
  }
  public getPartnerAccess(restaurantId: string): PartnerAccess | undefined {
    const map = this.getPartnerAccesses();
    return map[restaurantId];
  }
  public savePartnerAccess(access: PartnerAccess): void {
    const map = this.getPartnerAccesses();
    map[access.restaurantId] = access;
    this.setItem(STORAGE_KEYS.PARTNER_ACCESS, map);
  }
  public deletePartnerAccess(restaurantId: string): void {
    const map = this.getPartnerAccesses();
    delete map[restaurantId];
    this.setItem(STORAGE_KEYS.PARTNER_ACCESS, map);
  }
}

export const db = new MockDatabase();
