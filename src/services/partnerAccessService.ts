import { db } from '../storage/db';
import { api } from './api';
import { unmask } from '../utils/maskUtils';
import type { PartnerAccess, AdminUser } from '../types';

/**
 * Gera uma senha forte, memorável e fácil de digitar em dispositivos móveis
 * Exemplo: Oba@2026#8m3
 */
export function generateSecurePassword(): string {
  const prefixes = ['Oba', 'Sabor', 'Chef', 'Prato', 'Mesa', 'Gourmet', 'Burguer', 'Pizza'];
  const symbols = ['@', '#', '!', '$'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const year = new Date().getFullYear();
  
  // 3 caracteres alfanuméricos aleatórios adicionais para entropia
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}${symbol}${year}#${suffix}`;
}

export interface CreatePartnerAccessParams {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  ownerName: string;
  email: string;
  phone?: string;
  password?: string;
}

export const partnerAccessService = {
  /**
   * Obtém os dados de acesso do parceiro vinculado a um restaurante
   */
  async getAccess(restaurantId: string, restaurantEmail?: string): Promise<PartnerAccess | undefined> {
    const local = db.getPartnerAccess(restaurantId);
    if (local) return local;

    // Se não encontrou localmente e há token, tenta verificar se já existe na API
    const token = api.getToken();
    if (token && restaurantEmail) {
      try {
        const res = await api.get<any>('/admin/users', { search: restaurantEmail.trim(), per_page: 5 });
        const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
        const found = list.find(
          (u: any) => (u.email || '').toLowerCase() === restaurantEmail.trim().toLowerCase()
        );
        if (found) {
          const mapped: PartnerAccess = {
            restaurantId,
            restaurantName: '',
            restaurantSlug: '',
            userId: String(found.id),
            ownerName: found.name || found.full_name || 'Responsável',
            email: found.email,
            phone: found.phone || '',
            status: found.is_active === false || found.is_blocked === true ? 'Bloqueado' : 'Ativo',
            createdAt: found.created_at || new Date().toISOString(),
            updatedAt: found.updated_at || new Date().toISOString(),
          };
          db.savePartnerAccess(mapped);
          return mapped;
        }
      } catch {
        // ignora se a busca na API falhar
      }
    }

    return undefined;
  },

  /**
   * Cria ou configura as credenciais de acesso do restaurante ao Painel do Parceiro
   */
  async createAccess(
    params: CreatePartnerAccessParams,
    currentAdmin: AdminUser
  ): Promise<{ access: PartnerAccess; syncedApi: boolean; errorReason?: string }> {
    const password = (params.password || generateSecurePassword()).trim();
    let syncedApi = false;
    let userId: string | undefined = undefined;
    let errorReason: string | undefined = undefined;

    const token = api.getToken();
    if (token) {
      try {
        const payload = {
          name: params.ownerName.trim() || 'Gestor do Estabelecimento',
          email: params.email.trim().toLowerCase(),
          password,
          phone: params.phone?.trim() || undefined,
          role: 'PARTNER',
          is_active: true,
        };

        const res = await api.post<any>('/admin/users', payload);
        if (res && (res.id || res.user_id)) {
          userId = String(res.id || res.user_id);
          syncedApi = true;
        }
      } catch (err: any) {
        errorReason = err?.message || 'API remota offline ou sem permissão de cadastro de usuário.';
        console.warn('Erro ao criar usuário parceiro na API central via POST /admin/users, aplicando salvamento local:', err);
      }
    }

    const now = new Date().toISOString();
    const access: PartnerAccess = {
      restaurantId: params.restaurantId,
      restaurantName: params.restaurantName,
      restaurantSlug: params.restaurantSlug,
      userId: userId || `usr-partner-${Date.now()}`,
      ownerName: params.ownerName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone?.trim(),
      status: 'Ativo',
      temporaryPassword: password,
      createdAt: now,
      updatedAt: now,
      lastUpdatedBy: currentAdmin.name,
    };

    db.savePartnerAccess(access);

    // Registra na auditoria administrativa
    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: String(currentAdmin.role),
      action: 'Criação de acesso ao Painel do Parceiro',
      module: 'Parceiros & Estabelecimentos',
      entityId: params.restaurantId,
      details: `Acesso criado para o restaurante "${params.restaurantName}". Login: ${access.email}. Acesso liberado no portal do parceiro.`,
      currentValue: JSON.stringify({ email: access.email, restaurant: params.restaurantName, status: 'Ativo' }),
    });

    // Registra no histórico do próprio restaurante
    const rest = db.getRestaurants().find((r) => r.id === params.restaurantId);
    if (rest) {
      const historyEntry = {
        date: now,
        action: `Credenciais de acesso ao Painel do Parceiro geradas para "${access.email}" por ${currentAdmin.name}.`,
        adminName: currentAdmin.name,
      };
      const updatedHistory = [historyEntry, ...(rest.history || [])];
      db.saveRestaurants(
        db.getRestaurants().map((r) => (r.id === params.restaurantId ? { ...r, history: updatedHistory } : r))
      );
    }

    return { access, syncedApi, errorReason };
  },

  /**
   * Redefine / gera uma nova senha para o acesso do parceiro
   */
  async resetPassword(
    restaurantId: string,
    newPasswordInput: string | undefined,
    currentAdmin: AdminUser
  ): Promise<{ access: PartnerAccess; syncedApi: boolean; errorReason?: string }> {
    const current = db.getPartnerAccess(restaurantId);
    if (!current) {
      throw new Error('Nenhum acesso configurado para este estabelecimento.');
    }

    const newPassword = (newPasswordInput || generateSecurePassword()).trim();
    let syncedApi = false;
    let errorReason: string | undefined = undefined;

    const token = api.getToken();
    if (token && current.userId) {
      try {
        // Tenta atualizar senha via API se disponível
        await api.patch(`/admin/users/${current.userId}`, { password: newPassword });
        syncedApi = true;
      } catch (err: any) {
        errorReason = err?.message;
        console.warn('API de usuários não respondeu para reset de senha, aplicando fallback local:', err);
      }
    }

    const now = new Date().toISOString();
    const updated: PartnerAccess = {
      ...current,
      temporaryPassword: newPassword,
      updatedAt: now,
      lastUpdatedBy: currentAdmin.name,
      status: 'Ativo',
    };

    db.savePartnerAccess(updated);

    // Auditoria
    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: String(currentAdmin.role),
      action: 'Redefinição de senha do Painel do Parceiro',
      module: 'Parceiros & Estabelecimentos',
      entityId: restaurantId,
      details: `Senha de acesso ao Painel do Parceiro redefinida para o e-mail "${current.email}" da loja "${current.restaurantName}".`,
    });

    // Histórico do restaurante
    const rest = db.getRestaurants().find((r) => r.id === restaurantId);
    if (rest) {
      const historyEntry = {
        date: now,
        action: `Senha do Painel do Parceiro redefinida para o e-mail "${current.email}".`,
        adminName: currentAdmin.name,
      };
      const updatedHistory = [historyEntry, ...(rest.history || [])];
      db.saveRestaurants(
        db.getRestaurants().map((r) => (r.id === restaurantId ? { ...r, history: updatedHistory } : r))
      );
    }

    return { access: updated, syncedApi, errorReason };
  },

  /**
   * Bloqueia ou Reativa o acesso do parceiro ao Painel
   */
  async toggleAccessStatus(
    restaurantId: string,
    nextStatus: 'Ativo' | 'Bloqueado',
    currentAdmin: AdminUser,
    reason?: string
  ): Promise<{ access: PartnerAccess; syncedApi: boolean }> {
    const current = db.getPartnerAccess(restaurantId);
    if (!current) {
      throw new Error('Nenhum acesso configurado para este estabelecimento.');
    }

    let syncedApi = false;
    const token = api.getToken();
    if (token && current.userId) {
      try {
        const isActive = nextStatus === 'Ativo';
        await api.patch(`/admin/users/${current.userId}/status`, { is_active: isActive });
        syncedApi = true;
      } catch (err) {
        console.warn('Erro ao alternar status do parceiro na API, aplicando fallback local:', err);
      }
    }

    const now = new Date().toISOString();
    const updated: PartnerAccess = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      lastUpdatedBy: currentAdmin.name,
    };

    db.savePartnerAccess(updated);

    // Auditoria
    db.logAudit({
      adminId: currentAdmin.id,
      adminName: currentAdmin.name,
      adminRole: String(currentAdmin.role),
      action: `Acesso do Parceiro ${nextStatus === 'Ativo' ? 'Reativado' : 'Bloqueado'}`,
      module: 'Parceiros & Estabelecimentos',
      entityId: restaurantId,
      details: `Status do acesso ao portal do parceiro alterado para "${nextStatus}". Motivo: ${reason || 'Ação administrativa'}.`,
    });

    // Histórico do restaurante
    const rest = db.getRestaurants().find((r) => r.id === restaurantId);
    if (rest) {
      const historyEntry = {
        date: now,
        action: `Acesso ao Painel do Parceiro ${nextStatus === 'Ativo' ? 'reativado' : 'suspenso/bloqueado'} por ${currentAdmin.name}. ${reason ? `Motivo: ${reason}` : ''}`,
        adminName: currentAdmin.name,
      };
      const updatedHistory = [historyEntry, ...(rest.history || [])];
      db.saveRestaurants(
        db.getRestaurants().map((r) => (r.id === restaurantId ? { ...r, history: updatedHistory } : r))
      );
    }

    return { access: updated, syncedApi };
  },

  /**
   * Formata a mensagem amigável e profissional para envio via WhatsApp ou E-mail
   */
  formatInviteMessage(access: PartnerAccess, partnerUrl: string): string {
    const cleanPassword = access.temporaryPassword || 'Entre em contato com o suporte para redefinir sua senha.';
    return `Olá, ${access.ownerName || 'Parceiro'}! 👋\n\n` +
      `Seu restaurante *${access.restaurantName || 'seu estabelecimento'}* está cadastrado na plataforma *Oba Comida*! 🚀\n\n` +
      `Aqui estão seus dados de acesso ao *Painel do Parceiro* para gerenciar seu cardápio, horários e pedidos em tempo real:\n\n` +
      `🌐 *Link de Acesso:* ${partnerUrl}\n` +
      `👤 *Login (E-mail):* ${access.email}\n` +
      `🔑 *Senha Provisória:* ${cleanPassword}\n\n` +
      `💡 *Dica:* Ao acessar pela primeira vez, recomendamos alterar sua senha para uma de sua preferência.\n\n` +
      `Desejamos excelentes vendas e sucesso com o Oba Comida! 🍽️✨`;
  },

  /**
   * Retorna a URL pronta para abrir o WhatsApp Web ou aplicativo
   */
  getWhatsAppUrl(phone: string | undefined, message: string): string | null {
    if (!phone) return null;
    const clean = unmask(phone);
    if (!clean || clean.length < 10) return null;
    const phoneWithCountry = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  },
};

export default partnerAccessService;
