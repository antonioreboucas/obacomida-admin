import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardService,
  restaurantService,
  adminService,
  financialService,
  orderService,
  categoryService,
  promotionService,
  supportService,
  auditService,
  settingsService,
  uploadService,
} from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  RestaurantQueryParams,
  UserQueryParams,
  OrdersQueryParams,
  FinancialTransactionsQueryParams,
  AuditLogsQueryParams,
  CreateAdminUserRequest,
  CreateCommissionRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreatePromotionRequest,
  CreateCouponRequest,
  UpdateSupportTicketRequest,
  PlatformSettingsUpdate,
  BackendOrderStatus,
  UploadCategory,
} from '../types/api';
import type { RestaurantStatus, StoreTheme } from '../types';

// ==========================================
// MÓDULO 2: Dashboard Executivo
// ==========================================

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['admin', 'dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
    refetchInterval: 30000, // Auto-refresh metrics every 30s
  });
}

export function useAdminReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['admin', 'report', startDate, endDate],
    queryFn: () => dashboardService.getAdminReport(startDate, endDate),
  });
}

// ==========================================
// MÓDULO 3: Restaurantes & Moderação
// ==========================================

export function useRestaurants(params?: RestaurantQueryParams) {
  return useQuery({
    queryKey: ['admin', 'restaurants', params],
    queryFn: () => restaurantService.fetchAdminRestaurants(params),
  });
}

export function useRestaurantDetails(restaurantId?: string) {
  return useQuery({
    queryKey: ['admin', 'restaurant', restaurantId],
    queryFn: () => (restaurantId ? restaurantService.fetchRestaurantById(restaurantId) : undefined),
    enabled: !!restaurantId,
  });
}

export function useUpdateRestaurantStatus() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: RestaurantStatus;
      reason?: string;
    }) => restaurantService.updateStatusApi(id, status, currentUser, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-metrics'] });
      success('Status atualizado!', `Restaurante atualizado para ${variables.status}`);
    },
    onError: (err: any) => {
      error('Falha ao atualizar status', err.message || 'Erro desconhecido');
    },
  });
}

export function useCheckSlug(slug: string, excludeId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['admin', 'check-slug', slug, excludeId],
    queryFn: () => restaurantService.checkSlugApi(slug, excludeId),
    enabled: enabled && slug.length >= 3,
    staleTime: 5000,
  });
}

export function useUpdateRestaurantSlug() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, slug }: { id: string; slug: string }) =>
      restaurantService.updateSlugApi(id, slug, currentUser),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant', variables.id] });
        success('Link atualizado!', `Novo link: /${variables.slug}`);
      } else {
        error('Link indisponível', res.error || 'Erro ao alterar link');
      }
    },
    onError: (err: any) => {
      error('Erro ao alterar link', err.message);
    },
  });
}

export function useUpdateRestaurantTheme() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, theme }: { id: string; theme: StoreTheme }) =>
      restaurantService.updateThemeApi(id, theme, currentUser),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant', variables.id] });
      success('Identidade visual atualizada!', 'Tema do restaurante salvo com sucesso.');
    },
    onError: (err: any) => {
      error('Erro ao atualizar tema', err.message);
    },
  });
}

// ==========================================
// MÓDULO 4: Usuários & Permissões (RBAC)
// ==========================================

export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.fetchUsers(params?.search, params?.role, params?.page, params?.per_page),
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateAdminUserRequest) =>
      adminService.createAdminUser(payload, currentUser),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      success('Usuário criado!', `${newUser.name} cadastrado com perfil ${newUser.role}`);
    },
    onError: (err: any) => {
      error('Erro ao criar usuário', err.message);
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive, currentUser),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      success(
        updated?.is_active ? 'Usuário ativado!' : 'Usuário bloqueado!',
        `Status de ${updated?.name} alterado.`
      );
    },
    onError: (err: any) => {
      error('Erro ao alterar status', err.message);
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      adminService.assignRole(userId, roleName, currentUser),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      success('Perfil atribuído!', `Usuário ${updated?.name} agora possui perfil ${updated?.role}`);
    },
    onError: (err: any) => {
      error('Erro ao atribuir perfil', err.message);
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      adminService.revokeRole(userId, roleName, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      success('Perfil revogado!', 'Permissão removida com sucesso.');
    },
    onError: (err: any) => {
      error('Erro ao revogar perfil', err.message);
    },
  });
}

// ==========================================
// MÓDULO 5: Financeiro, Comissões e Extrato
// ==========================================

export function useCommissionPolicies() {
  return useQuery({
    queryKey: ['admin', 'commission-policies'],
    queryFn: () => financialService.fetchCommissionPolicies(),
  });
}

export function useCreateCommissionPolicy() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateCommissionRequest) =>
      financialService.createCommissionPolicy(payload, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission-policies'] });
      success('Política cadastrada!', 'Nova regra de comissão registrada.');
    },
    onError: (err: any) => {
      error('Erro ao salvar comissão', err.message);
    },
  });
}

export function useFinancialTransactions(params?: FinancialTransactionsQueryParams) {
  return useQuery({
    queryKey: ['admin', 'financial-transactions', params],
    queryFn: () => financialService.fetchTransactions(params),
  });
}

// ==========================================
// MÓDULO 6: Pedidos
// ==========================================

export function useOrders(params?: OrdersQueryParams) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => orderService.fetchOrders(params),
    refetchInterval: 15000, // Auto-refetch orders every 15s
  });
}

export function useOrderDetails(orderId?: string) {
  return useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: () => (orderId ? orderService.fetchOrderById(orderId) : undefined),
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: BackendOrderStatus;
      notes?: string;
    }) => orderService.updateStatusApi(id, status, currentUser, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', variables.id] });
      success('Pedido atualizado!', `Status alterado para ${variables.status}`);
    },
    onError: (err: any) => {
      error('Erro ao atualizar pedido', err.message);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancelOrderApi(id, reason, currentUser),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', variables.id] });
      success('Pedido cancelado!', 'Cancelamento registrado com justificativa.');
    },
    onError: (err: any) => {
      error('Erro ao cancelar pedido', err.message);
    },
  });
}

// ==========================================
// MÓDULO 7: Categorias Globais
// ==========================================

export function useCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => categoryService.fetchCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryService.createApi(data, currentUser),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      success('Categoria criada!', `"${cat.name}" adicionada ao catálogo.`);
    },
    onError: (err: any) => {
      error('Erro ao criar categoria', err.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoryService.updateApi(id, data as any, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      success('Categoria atualizada!', 'Dados salvos com sucesso.');
    },
    onError: (err: any) => {
      error('Erro ao atualizar categoria', err.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteApi(id, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      success('Categoria excluída!', 'Removida do marketplace.');
    },
    onError: (err: any) => {
      error('Erro ao remover categoria', err.message);
    },
  });
}

// ==========================================
// MÓDULO 8: Promoções & Cupons
// ==========================================

export function usePromotions() {
  return useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: () => promotionService.fetchPromotions(),
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreatePromotionRequest) =>
      promotionService.createPromotionApi(data, currentUser),
    onSuccess: (promo) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      success('Campanha criada!', `"${promo.name}" ativada na plataforma.`);
    },
    onError: (err: any) => {
      error('Erro ao criar promoção', err.message);
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateCouponRequest) =>
      promotionService.createCouponApi(data, currentUser),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      success('Cupom criado!', `Código: ${coupon.code}`);
    },
    onError: (err: any) => {
      error('Erro ao criar cupom', err.message);
    },
  });
}

// ==========================================
// MÓDULO 9: Suporte & Chamados
// ==========================================

export function useSupportTickets(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin', 'support-tickets', statusFilter],
    queryFn: () => supportService.fetchTickets(statusFilter),
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: UpdateSupportTicketRequest;
    }) => supportService.updateTicketApi(ticketId, payload, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      success('Atendimento atualizado!', 'Chamado atualizado com sucesso.');
    },
    onError: (err: any) => {
      error('Erro ao atualizar chamado', err.message);
    },
  });
}

// ==========================================
// MÓDULO 10: Trilha de Auditoria
// ==========================================

export function useAuditLogs(params?: AuditLogsQueryParams) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => auditService.fetchAuditLogs(params),
  });
}

// ==========================================
// MÓDULO 11: Configurações Gerais
// ==========================================

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['admin', 'platform-settings'],
    queryFn: () => settingsService.fetchSettings(),
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (updates: PlatformSettingsUpdate) =>
      settingsService.updateApi(updates as any, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-settings'] });
      success('Configurações salvas!', 'Parâmetros globais atualizados com sucesso.');
    },
    onError: (err: any) => {
      error('Erro ao salvar configurações', err.message);
    },
  });
}

// ==========================================
// MÓDULO 12: Upload de Imagens
// ==========================================

export function useUploadImage() {
  const { error } = useToast();

  return useMutation({
    mutationFn: ({ file, category }: { file: File; category?: UploadCategory }) =>
      uploadService.uploadImage(file, category),
    onError: (err: any) => {
      error('Erro no upload', err.message);
    },
  });
}
