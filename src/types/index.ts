export type AdminRole = 'superadmin' | 'admin' | 'operator' | 'financial';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'Ativo' | 'Inativo';
  avatar?: string;
  phone: string;
  createdAt: string;
  lastLogin: string;
  department: string;
}

export type RestaurantStatus = 'Pendente' | 'Em análise' | 'Aprovado' | 'Ativo' | 'Suspenso' | 'Reprovado';

export interface StoreTheme {
  primaryColor: string; // Cor principal da marca (botões, cabeçalho, destaques)
  secondaryColor: string; // Cor secundária / destaque (gradientes, badges, ícones)
  presetKey?: string; // Template pré-definido ou customizado
  textColor?: string; // Cor de texto contrastante
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string; // Identificador da loja na URL (ex: 'acai-tropical')
  appUrl?: string; // obacomida.com.br/{slug}-app (Aplicativo do Consumidor)
  partnerUrl?: string; // obacomida.com.br/{slug} (Painel do Parceiro / Restaurante)
  logo: string;
  coverImage?: string;
  category: string;
  categoryId: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  cnpj: string;
  createdAt: string;
  status: RestaurantStatus;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  commissionRate: number; // percentage, e.g. 12%
  fixedFee: number; // e.g. 1.50
  minimumOrder: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  isOpen: boolean;
  theme?: StoreTheme;
  history: {
    date: string;
    action: string;
    adminName: string;
    notes?: string;
  }[];
}

export interface CustomerAddress {
  id: string;
  title: string; // e.g. 'Casa', 'Trabalho'
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  status: 'Ativo' | 'Inativo';
  addresses: CustomerAddress[];
  avatar?: string;
}

export type OrderStatus = 'Criado' | 'Confirmado' | 'Em preparação' | 'Saiu para entrega' | 'Entregue' | 'Cancelado';
export type PaymentMethod = 'Cartão de Crédito' | 'Pix' | 'Dinheiro' | 'Vale Refeição';
export type DeliveryType = 'Entrega' | 'Retirada';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  code: string; // e.g. #OBA-4912
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  city: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    adminName?: string;
  }[];
  occurrences: {
    id: string;
    date: string;
    type: string;
    description: string;
    resolved: boolean;
    resolutionNote?: string;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  displayOrder: number;
  active: boolean;
  productsCount: number;
  description?: string;
}

export type ProductStatus = 'Aprovado' | 'Em moderação' | 'Rejeitado';

export interface Product {
  id: string;
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  available: boolean;
  status: ProductStatus;
  createdAt: string;
  moderationHistory: {
    date: string;
    action: string;
    justification: string;
    adminName: string;
  }[];
}

export type PromotionType = 'percent' | 'fixed' | 'free_shipping' | 'coupon' | 'category' | 'restaurant';
export type PromotionStatus = 'Ativa' | 'Agendada' | 'Pausada' | 'Expirada';
export type TargetAudience = 'all' | 'new_customers' | 'vip' | 'inactive';

export interface Promotion {
  id: string;
  name: string;
  code?: string;
  type: PromotionType;
  discountValue: number; // e.g. 15 for 15% or 10.00 for R$ 10
  minOrderValue: number;
  startDate: string;
  endDate: string;
  budget: number;
  usedBudget: number;
  maxUses: number;
  currentUses: number;
  targetAudience: TargetAudience;
  status: PromotionStatus;
  categoryId?: string;
  categoryName?: string;
  restaurantId?: string;
  restaurantName?: string;
  description: string;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  restaurantName: string;
  orderId: string;
  orderCode: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  reported: boolean;
  reportReason?: string;
  moderationStatus: 'pending' | 'approved' | 'hidden';
  moderationJustification?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export type PayoutStatus = 'Pendente' | 'Processado' | 'Retido' | 'Pago';

export interface FinancialRecord {
  id: string;
  restaurantId: string;
  restaurantName: string;
  orderId: string;
  orderCode: string;
  date: string;
  grossAmount: number;
  commissionAmount: number;
  commissionPercentage: number;
  serviceFee: number;
  deliveryFee: number;
  netAmount: number;
  payoutStatus: PayoutStatus;
  payoutDate?: string;
  referenceMonth: string; // e.g. "2026-11"
}

export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TicketStatus = 'Aberto' | 'Em atendimento' | 'Aguardando resposta' | 'Resolvido' | 'Encerrado';
export type RequesterType = 'Cliente' | 'Restaurante' | 'Entregador';

export interface SupportTicketMessage {
  id: string;
  sender: string;
  isStaff: boolean;
  timestamp: string;
  text: string;
}

export interface SupportTicket {
  id: string;
  code: string; // e.g. #TK-1082
  requesterName: string;
  requesterEmail: string;
  requesterType: RequesterType;
  subject: string;
  category: string;
  createdAt: string;
  assignedTo: string;
  priority: TicketPriority;
  status: TicketStatus;
  messages: SupportTicketMessage[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  action: string;
  module: string;
  timestamp: string;
  entityId: string;
  details: string;
  previousValue?: string;
  currentValue?: string;
}

export interface PlatformSettings {
  platformName: string;
  companyName: string;
  cnpj: string;
  supportEmail: string;
  supportPhone: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  defaultCommissionRate: number; // e.g. 12%
  defaultFixedFee: number; // e.g. 1.50
  defaultServiceFeeRate: number; // e.g. 3%
  minOrderValueDefault: number; // e.g. 20.00
  allowedPaymentMethods: PaymentMethod[];
  maintenanceMode: boolean;
  autoApproveNewRestaurants: boolean;
  supportOperatingHours: string;
}

export interface DashboardMetrics {
  totalRestaurants: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  totalCustomers: number;
  totalOrders: number;
  activeOrders: number;
  grossRevenue: number;
  platformRevenue: number;
  estimatedCommissions: number;
  averageTicket: number;
  cancelledRate: number;
}
