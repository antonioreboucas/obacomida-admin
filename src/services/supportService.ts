import { db } from '../storage/db';
import type { SupportTicket, TicketStatus, TicketPriority, AdminUser } from '../types';

export const supportService = {
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
      adminRole: admin.role,
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
      adminRole: admin.role,
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
      adminRole: admin.role,
      action: 'Alteração de prioridade de chamado de suporte',
      module: 'Suporte',
      entityId: ticket.code,
      details: `Chamado ${ticket.code} prioridade alterada para "${newPriority}"`,
    });

    return updated;
  },
};
