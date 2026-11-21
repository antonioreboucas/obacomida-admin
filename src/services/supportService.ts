import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { SupportTicket, TicketStatus, TicketPriority, AdminUser, RequesterType } from '../types';
import type { SupportTicketStatus, SupportTicketPriority, UpdateSupportTicketRequest } from '../types/api';

const STATUS_MAP: Record<string, SupportTicketStatus> = {
  Aberto: 'OPEN',
  'Em atendimento': 'IN_PROGRESS',
  'Aguardando resposta': 'IN_PROGRESS',
  Resolvido: 'RESOLVED',
  Encerrado: 'CLOSED',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

const LEGACY_STATUS_MAP: Record<string, TicketStatus> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Encerrado',
};

export const supportService = {
  /**
   * GET /api/v1/support?status=OPEN
   * Lista todos os chamados abertos por clientes e parceiros
   */
  async fetchTickets(statusFilter?: string): Promise<SupportTicket[]> {
    try {
      const backendStatus =
        statusFilter && statusFilter !== 'all'
          ? STATUS_MAP[statusFilter] || statusFilter
          : undefined;

      const params = backendStatus ? { status: backendStatus } : undefined;
      let data: any = null;
      try {
        data = await api.get<any>('/support', params);
      } catch (err: any) {
        if (err?.status === 404) {
          data = await api.get<any>('/support/tickets', params);
        } else {
          throw err;
        }
      }

      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        const mapped = list.map((item) => this.normalizeFromApi(item));
        db.saveSupportTickets(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API /support inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return [];
    }

    const all = db.getSupportTickets();
    if (!statusFilter || statusFilter === 'all') return all;
    return all.filter((t) => t.status === statusFilter || STATUS_MAP[t.status] === statusFilter);
  },

  /**
   * PATCH /api/v1/support/{ticket_id}
   * Body: { status: TicketStatus, priority?: "LOW"|"MEDIUM"|"HIGH"|"URGENT", resolution_notes?: string }
   */
  async updateTicketApi(
    ticketId: string,
    payload: UpdateSupportTicketRequest,
    admin: AdminUser
  ): Promise<SupportTicket | undefined> {
    try {
      try {
        await api.patch(`/support/${ticketId}`, payload);
      } catch (err: any) {
        if (err?.status === 404) {
          await api.patch(`/support/tickets/${ticketId}`, payload);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar ticket via PATCH /support/{id}, aplicando fallback:', err);
    }

    const legacyStatus = LEGACY_STATUS_MAP[payload.status] || (payload.status as any);
    return this.updateStatus(ticketId, legacyStatus, admin, payload.resolution_notes);
  },

  /**
   * PATCH /api/v1/support/{ticket_id}/reply
   */
  async replyTicket(
    ticketId: string,
    message: string,
    admin: AdminUser
  ): Promise<SupportTicket | undefined> {
    try {
      await api.patch(`/support/${ticketId}/reply`, { message });
    } catch {
      try {
        await api.patch(`/support/tickets/${ticketId}/reply`, { message });
      } catch (err) {
        console.warn('Erro ao responder chamado via API, aplicando fallback local:', err);
      }
    }

    return this.addMessage(ticketId, message, admin);
  },

  /**
   * Encerra o chamado
   */
  async closeTicket(
    ticketId: string,
    admin: AdminUser
  ): Promise<SupportTicket | undefined> {
    return this.updateTicketApi(
      ticketId,
      { status: 'CLOSED', resolution_notes: 'Chamado encerrado pelo suporte' },
      admin
    );
  },

  getAll(): SupportTicket[] {
    return db.getSupportTickets();
  },

  getById(id: string): SupportTicket | undefined {
    return db.getSupportTickets().find((t) => t.id === id || t.code.toLowerCase() === id.toLowerCase());
  },

  addMessage(ticketId: string, text: string, admin: AdminUser): SupportTicket | undefined {
    const tickets = db.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return undefined;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: `${admin.name} (Suporte Oba Comida)`,
      isStaff: true,
      timestamp: new Date().toISOString(),
      text,
    };

    const updated: SupportTicket = {
      ...ticket,
      messages: [...ticket.messages, newMessage],
      status: ticket.status === 'Aberto' ? 'Em atendimento' : ticket.status,
    };

    db.saveSupportTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Resposta em chamado de suporte',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Resposta enviada no chamado #${ticket.code}`,
    });

    return updated;
  },

  updateStatus(
    ticketId: string,
    newStatus: TicketStatus,
    admin: AdminUser,
    note?: string
  ): SupportTicket | undefined {
    const tickets = db.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return undefined;

    const updated: SupportTicket = {
      ...ticket,
      status: newStatus,
    };

    db.saveSupportTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Alteração de status do chamado',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Chamado #${ticket.code} alterado para "${newStatus}". ${note ? `Nota: ${note}` : ''}`,
      previousValue: ticket.status,
      currentValue: newStatus,
    });

    return updated;
  },

  updatePriority(
    ticketId: string,
    newPriority: TicketPriority,
    admin: AdminUser
  ): SupportTicket | undefined {
    const tickets = db.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return undefined;

    const updated: SupportTicket = {
      ...ticket,
      priority: newPriority,
    };

    db.saveSupportTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Alteração de prioridade do chamado',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Prioridade do chamado #${ticket.code} alterada para "${newPriority}"`,
    });

    return updated;
  },

  normalizeFromApi(item: any): SupportTicket {
    const rawStatus = item.status || 'OPEN';
    const legacyStatus = LEGACY_STATUS_MAP[rawStatus] || rawStatus;

    return {
      id: String(item.id),
      code: item.code || `#TK-${String(item.id).slice(-4)}`,
      requesterName: item.requester_name || item.requesterName || 'Usuário',
      requesterEmail: item.requester_email || item.requesterEmail || 'usuario@email.com',
      requesterType: item.requester_type || item.requesterType || 'Cliente',
      subject: item.subject || 'Atendimento ao Cliente',
      category: item.category || 'Geral',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      assignedTo: item.assigned_to || item.assignedTo || 'Equipe de Suporte',
      priority: item.priority || 'Média',
      status: legacyStatus,
      messages: Array.isArray(item.messages)
        ? item.messages.map((m: any) => ({
            id: String(m.id || Math.random()),
            sender: m.sender || 'Atendente',
            isStaff: Boolean(m.is_staff ?? m.isStaff),
            timestamp: m.timestamp || new Date().toISOString(),
            text: m.text || m.message || '',
          }))
        : [],
    };
  },
};

export default supportService;
