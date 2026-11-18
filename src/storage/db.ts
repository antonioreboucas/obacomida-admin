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
      // Purge legacy mock datasets from localStorage when running in real API mode
      const currentVer = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (currentVer !== 'real_api_mode_v2') {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USERS);
        localStorage.removeItem(STORAGE_KEYS.RESTAURANTS);
        localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(STORAGE_KEYS.PROMOTIONS);
        localStorage.removeItem(STORAGE_KEYS.REVIEWS);
        localStorage.removeItem(STORAGE_KEYS.FINANCIAL);
        localStorage.removeItem(STORAGE_KEYS.SUPPORT);
        localStorage.removeItem(STORAGE_KEYS.AUDIT);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
        localStorage.setItem(STORAGE_KEYS.VERSION, 'real_api_mode_v2');
      }
      return;
    }

    // If version doesn't exist or is older, populate initial data (Mock mode only)
    if (!localStorage.getItem(STORAGE_KEYS.VERSION)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    if (!isMockEnabled()) {
      this.clearMockData();
      return;
    }

    localStorage.setItem(STORAGE_KEYS.VERSION, '1.0');
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(initialAdminUsers));
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(initialRestaurants));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(initialPromotions));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initialReviews));
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(initialFinancialRecords));
    localStorage.setItem(STORAGE_KEYS.SUPPORT, JSON.stringify(initialSupportTickets));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(initialAuditLogs));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(initialAdminUsers[0]));
    this.notify();
  }

  public clearMockData() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USERS);
    localStorage.removeItem(STORAGE_KEYS.RESTAURANTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PROMOTIONS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.FINANCIAL);
    localStorage.removeItem(STORAGE_KEYS.SUPPORT);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    localStorage.setItem(STORAGE_KEYS.VERSION, 'real_api_mode');
    this.notify();
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
    return this.getItem<AdminUser[]>(STORAGE_KEYS.ADMIN_USERS, isMockEnabled() ? initialAdminUsers : []);
  }
  public saveAdminUsers(users: AdminUser[]): void {
    this.setItem(STORAGE_KEYS.ADMIN_USERS, users);
  }

  // Active User / Session
  public getActiveUser(): AdminUser {
    const fallbackUser: AdminUser = isMockEnabled()
      ? initialAdminUsers[0]
      : {
          id: '',
          name: '',
          email: '',
          role: 'ADMIN',
          status: 'Inativo',
          createdAt: '',
          lastLogin: '',
          phone: '',
          department: '',
        };
    return this.getItem<AdminUser>(STORAGE_KEYS.ACTIVE_USER, fallbackUser);
  }
  public setActiveUser(user: AdminUser): void {
    this.setItem(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // Restaurants
  public getRestaurants(): Restaurant[] {
    const list = this.getItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, isMockEnabled() ? initialRestaurants : []);
    let hasChanges = false;
    const normalized = list.map((r) => {
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
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, isMockEnabled() ? initialCustomers : []);
  }
  public saveCustomers(customers: Customer[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Products
  public getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, isMockEnabled() ? initialProducts : []);
  }
  public saveProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  // Orders
  public getOrders(): Order[] {
    return this.getItem<Order[]>(STORAGE_KEYS.ORDERS, isMockEnabled() ? initialOrders : []);
  }
  public saveOrders(orders: Order[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  // Categories
  public getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, isMockEnabled() ? initialCategories : []);
  }
  public saveCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Promotions
  public getPromotions(): Promotion[] {
    return this.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, isMockEnabled() ? initialPromotions : []);
  }
  public savePromotions(promotions: Promotion[]): void {
    this.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
  }

  // Reviews
  public getReviews(): Review[] {
    return this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, isMockEnabled() ? initialReviews : []);
  }
  public saveReviews(reviews: Review[]): void {
    this.setItem(STORAGE_KEYS.REVIEWS, reviews);
  }

  // Financial
  public getFinancialRecords(): FinancialRecord[] {
    return this.getItem<FinancialRecord[]>(STORAGE_KEYS.FINANCIAL, isMockEnabled() ? initialFinancialRecords : []);
  }
  public saveFinancialRecords(records: FinancialRecord[]): void {
    this.setItem(STORAGE_KEYS.FINANCIAL, records);
  }

  // Support
  public getSupportTickets(): SupportTicket[] {
    return this.getItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT, isMockEnabled() ? initialSupportTickets : []);
  }
  public saveSupportTickets(tickets: SupportTicket[]): void {
    this.setItem(STORAGE_KEYS.SUPPORT, tickets);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT, isMockEnabled() ? initialAuditLogs : []);
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
}

export const db = new MockDatabase();
