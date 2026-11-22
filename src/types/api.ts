// API Standard Envelopes & Domain Types for Oba Comida Central Admin (FastAPI + PostgreSQL)

// ==========================================
// 1. STANDARD API ENVELOPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export type ApiPaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export interface ApiErrorDetail {
  loc?: string[];
  msg: string;
  type?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// ==========================================
// MÓDULO 1: Autenticação, Sessão e Perfil
// ==========================================

export type AuthRole = 'SUPER_ADMIN' | 'ADMIN' | 'PARTNER' | 'CUSTOMER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  roles: AuthRole[];
  permissions: string[];
  created_at?: string;
  last_login?: string;
  department?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ==========================================
// MÓDULO 2: Dashboard Executivo (KPIs)
// ==========================================

export interface AdminDashboardMetrics {
  total_sales: number; // Faturamento bruto total transacionado (GMV)
  platform_revenue: number; // Receita líquida da plataforma (comissões + taxas de serviço)
  total_orders_count: number; // Total de pedidos concluídos/entregues
  active_restaurants_count: number; // Estabelecimentos parceiros ativos
  registered_customers_count: number; // Total de clientes cadastrados
  total_partners_count: number; // Total de donos e gerentes de restaurantes
  average_ticket: number; // Ticket médio por pedido
}

export interface AdminReportData {
  period_start?: string;
  period_end?: string;
  metrics: AdminDashboardMetrics;
  revenue_by_date?: Array<{ date: string; gross_sales: number; platform_revenue: number; orders_count: number }>;
  sales_by_category?: Array<{ category_name: string; total_orders: number; gross_sales: number }>;
  top_restaurants?: Array<{ restaurant_id: string; restaurant_name: string; orders_count: number; gross_sales: number }>;
}

// ==========================================
// MÓDULO 3: Gestão & Aprovação de Restaurantes
// ==========================================

export type RestaurantStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'REJECTED';

export interface RestaurantOperatingHours {
  day_of_week: number; // 0=Domingo, 1=Segunda, etc.
  open_time: string; // "08:00"
  close_time: string; // "22:00"
  is_closed?: boolean;
}

export interface RestaurantThemeConfig {
  primary_color: string;
  secondary_color: string;
  preset_key?: string;
  text_color?: string;
}

export interface RestaurantListItem {
  id: string;
  corporate_name?: string; // Razão Social
  trade_name?: string; // Nome Fantasia
  name?: string;
  cnpj: string;
  slug: string;
  city: string;
  state?: string;
  category_name?: string;
  global_category_name?: string;
  category_id?: string;
  status: RestaurantStatus;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  commission_rate?: number;
  fixed_fee?: number;
  created_at: string;
  total_orders?: number;
  total_revenue?: number;
  rating?: number;
  is_open?: boolean;
}

export interface RestaurantDetail extends RestaurantListItem {
  address?: string;
  number?: string;
  neighborhood?: string;
  zip_code?: string;
  operating_hours?: RestaurantOperatingHours[];
  theme?: RestaurantThemeConfig;
  owner_name?: string;
  minimum_order?: number;
  delivery_fee?: number;
  average_delivery_time_min?: number;
  average_delivery_time_max?: number;
  status_history?: Array<{
    status: RestaurantStatus;
    reason?: string;
    created_at: string;
    changed_by_email?: string;
  }>;
}

export interface UpdateRestaurantStatusRequest {
  status: RestaurantStatus;
  reason?: string;
}

export interface CheckSlugResponse {
  available: boolean;
  slug: string;
  message?: string;
}

export interface UpdateRestaurantSlugRequest {
  slug: string;
}

export interface UpdateRestaurantThemeRequest {
  theme: RestaurantThemeConfig;
}

export interface AddressCreateRequest {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  complement?: string;
  reference_point?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface CreateRestaurantRequest {
  trade_name: string;
  corporate_name: string;
  cnpj: string;
  global_category_id: string;
  phone: string;
  email: string;
  slug?: string;
  theme?: RestaurantThemeConfig;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  minimum_order?: number;
  delivery_fee?: number;
  average_delivery_time_min?: number;
  average_delivery_time_max?: number;
  address?: AddressCreateRequest;
  status?: RestaurantStatus;
  commission_rate?: number;
  commission_percentage?: number;
  fixed_fee?: number;
  service_fee?: number;
  owner_email?: string;
}

export interface RestaurantQueryParams {
  status?: RestaurantStatus | string;
  city?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 4: Gestão de Usuários & RBAC
// ==========================================

export type PlatformRole = 'CUSTOMER' | 'PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface PlatformUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: PlatformRole;
  roles: PlatformRole[];
  is_active: boolean;
  is_verified?: boolean;
  avatar_url?: string;
  department?: string;
  created_at: string;
  last_login?: string;
}

export interface CreateAdminUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
}

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface AssignRoleRequest {
  role_name: string;
}

export interface UserQueryParams {
  role?: PlatformRole | string;
  search?: string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 5: Financeiro, Comissões & Ledger
// ==========================================

export interface CommissionPolicy {
  id?: string;
  restaurant_id: string | null; // null = regra global padrão da plataforma
  restaurant_name?: string;
  percentage: number; // ex: 12.5%
  fixed_fee: number; // ex: 0.00
  service_fee: number; // ex: 2.00
  created_at?: string;
  updated_at?: string;
}

export interface CreateCommissionRequest {
  restaurant_id: string | null;
  percentage: number;
  fixed_fee: number;
  service_fee: number;
}

export type LedgerTransactionStatus = 'PENDING' | 'SETTLED' | 'REFUNDED' | 'CANCELLED';

export interface LedgerTransaction {
  id: string;
  order_id: string;
  order_code?: string;
  restaurant_id: string;
  restaurant_name?: string;
  gross_sales: number; // Valor total bruto
  platform_commission: number; // Comissão da plataforma retida
  service_fee: number; // Taxa de conveniência/serviço
  delivery_fee: number; // Taxa de entrega
  discounts: number; // Descontos aplicados
  refunds: number; // Estornos
  restaurant_net_amount: number; // Repasse líquido ao parceiro
  status: LedgerTransactionStatus;
  created_at: string;
  settled_at?: string;
}

export interface FinancialTransactionsQueryParams {
  restaurant_id?: string;
  status?: LedgerTransactionStatus | string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 6: Monitoramento Global de Pedidos
// ==========================================

export type BackendOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemOption {
  name: string;
  price: number;
}

export interface OrderItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  options?: OrderItemOption[];
}

export interface OrderDetailFull {
  id: string;
  code: string; // Ex: #OBA-4912
  status: BackendOrderStatus;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderItemDetail[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  delivery_type: string;
  delivery_address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    complement?: string;
    reference?: string;
  } | string;
  created_at: string;
  estimated_delivery_time?: string;
  status_history: Array<{
    status: BackendOrderStatus;
    timestamp: string;
    notes?: string;
    admin_name?: string;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: BackendOrderStatus;
  notes?: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface OrdersQueryParams {
  restaurant_id?: string;
  status?: BackendOrderStatus | string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 7: Categorias Globais do Marketplace
// ==========================================

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
  products_count?: number;
  created_at?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

// ==========================================
// MÓDULO 8: Promoções & Cupons
// ==========================================

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PlatformPromotion {
  id: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  restaurant_id?: string | null;
  restaurant_name?: string;
  created_at?: string;
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  restaurant_id?: string | null;
}

export interface PlatformCoupon {
  id?: string;
  code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_uses: number;
  current_uses?: number;
  is_active?: boolean;
  expires_at?: string;
  created_at?: string;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_uses: number;
}

// ==========================================
// MÓDULO 9: Helpdesk & Atendimento ao Cliente/Parceiro
// ==========================================

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicketItem {
  id: string;
  code: string; // Ex: #TK-1082
  requester_name: string;
  requester_email: string;
  requester_type: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY_PARTNER';
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
  resolution_notes?: string;
  messages?: Array<{
    id: string;
    sender: string;
    is_staff: boolean;
    timestamp: string;
    text: string;
  }>;
}

export interface UpdateSupportTicketRequest {
  status: SupportTicketStatus;
  priority?: SupportTicketPriority;
  resolution_notes?: string;
}

export interface SupportQueryParams {
  status?: SupportTicketStatus | string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 10: Trilha de Auditoria (Audit Logs)
// ==========================================

export interface AuditLogItem {
  id: string;
  user_email: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_values?: Record<string, any> | string | null;
  new_values?: Record<string, any> | string | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogsQueryParams {
  action?: string;
  entity_name?: string;
  entity_id?: string;
  page?: number;
  per_page?: number;
}

// ==========================================
// MÓDULO 11: Configurações Gerais da Plataforma
// ==========================================

export interface PlatformSettingsData {
  platform_name: string;
  company_name: string;
  cnpj: string;
  support_email: string;
  support_phone: string;
  support_operating_hours?: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  default_commission_rate: number; // Ex: 12.5%
  default_fixed_fee: number; // Ex: 1.50
  default_service_fee_rate: number; // Ex: 3.0%
  min_order_value_default: number; // Ex: 20.00
  allowed_payment_methods: string[];
  maintenance_mode: boolean;
  auto_approve_new_restaurants: boolean;
  app_domain: string; // Ex: 'obacomida.com.br'
  app_protocol: 'https' | 'http';
  app_path_pattern?: string;
  partner_domain: string; // Ex: 'parceiro.obacomida.com.br'
  partner_protocol: 'https' | 'http';
  partner_path_pattern?: string;
}

export type PlatformSettingsUpdate = Partial<PlatformSettingsData>;

// ==========================================
// MÓDULO 12: Upload Unificado de Imagens
// ==========================================

export type UploadCategory = 'logos' | 'banners' | 'categories' | 'avatars' | 'general';

export interface ImageUploadResponse {
  url: string;
  filename: string;
}
