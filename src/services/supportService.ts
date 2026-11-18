import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { SupportTicket, TicketStatus, TicketPriority, AdminUser, RequesterType } from '../types';

export const supportService = {
  /**
   * GET /api/v1/support/tickets?status=OPEN
   * Lista chamados de suporte por status
   */
  async fetchTickets(statusFilter?: string): Promise<SupportTicket[]> {
    try {
      const backendStatus =
        statusFilter === 'all'
          ? undefined
          : statusFilter === 'Aberto'
          ? 'OPEN'
          : statusFilter === 'Encerrado' || statusFilter === 'Resolvido'
          ? 'CLOSED'
          : statusFilter || 'OPEN';

      const params = backendStatus ? { status: backendStatus } : undefined;
      const data = await api.get<any>('/support/tickets', params);
      const list = Array.isArray(data) ? data : (data?.items || data?.data);

      if (Array.isArray(list)) {
        return list.map((item) => this.normalizeFromApi(item));
      }
      if (!isMockEnabled()) {
        return [];
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn('Erro ao carregar chamados da API central:', err);
        return [];
      }
    }

    const all = db.getSupportTickets();
    if (!statusFilter || statusFilter === 'all') return all;
    return all.filter((t) => t.status === statusFilter);
  },

  /**
   * PATCH /api/v1/support/tickets/{id}/reply
   * Payload: { message: "..." }
   */
  async replyTicket(
    ticketId: string,
    message: string,
    admin: AdminUser
  ): Promise<SupportTicket | undefined> {
    try {
      await api.patch(`/support/tickets/${ticketId}/reply`, {
        message,
      });
    } catch (err) {
      console.warn('Erro ao responder chamado via API, aplicando fallback local:', err);
    }

    return this.addMessage(ticketId, message, admin);
  },

  /**
   * PATCH /api/v1/support/tickets/{id}/close
   * Encerra o chamado
   */
  async closeTicket(
    ticketId: string,
    admin: AdminUser
  ): Promise<SupportTicket | undefined> {
    try {
      await api.patch(`/support/tickets/${ticketId}/close`);
    } catch (err) {
      console.warn('Erro ao encerrar chamado via API, aplicando fallback local:', err);
    }

    return this.updateStatus(ticketId, 'Encerrado', admin, 'Chamado finalizado e encerrado pelo suporte');
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
      status: ticket.status === 'Aberto' ? 'Em atendimento' : ticket.status,
      assignedTo: admin.name,
      messages: [...ticket.messages, newMessage],
    };

    db.saveSupportTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Envio de resposta no chamado de suporte',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Nova resposta enviada no chamado ${ticket.code} (${ticket.subject})`,
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
      action: 'Alteração de status de chamado de suporte',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Chamado ${ticket.code} alterado para "${newStatus}". ${note || ''}`,
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

    const updated: SupportTicket = { ...ticket, priority: newPriority };
    db.saveSupportTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Alteração de prioridade de chamado de suporte',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Chamado ${ticket.code} prioridade alterada para "${newPriority}"`,
    });

    return updated;
  },

  normalizeFromApi(item: any): SupportTicket {
    const statusMap: Record<string, TicketStatus> = {
      OPEN: 'Aberto',
      IN_PROGRESS: 'Em atendimento',
      WAITING: 'Aguardando resposta',
      RESOLVED: 'Resolvido',
      CLOSED: 'Encerrado',
    };

    return {
      id: String(item.id),
      code: item.code || `#TK-${String(item.id).slice(-4)}`,
      requesterName: item.requester_name || item.requesterName || 'Usuário',
      requesterEmail: item.requester_email || item.requesterEmail || 'contato@obacomida.com.br',
      requesterType: (item.requester_type || item.requesterType || 'Cliente') as RequesterType,
      subject: item.subject || 'Dúvida operacional',
      category: item.category || 'Atendimento Geral',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      assignedTo: item.assigned_to || item.assignedTo || 'Equipe de Suporte',
      priority: (item.priority || 'Média') as TicketPriority,
      status: statusMap[item.status] || item.status || 'Aberto',
      messages: Array.isArray(item.messages)
        ? item.messages.map((m: any) => ({
            id: String(m.id || Math.random()),
            sender: m.sender || 'Atendente',
            isStaff: Boolean(m.is_staff ?? m.isStaff ?? false),
            timestamp: m.timestamp || new Date().toISOString(),
            text: m.text || m.message || '',
          }))
        : [],
    };
  },
};
