import React, { useState, useMemo, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Send,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Shield,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import { supportService } from '../services/supportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import type { SupportTicket, TicketPriority, TicketStatus, RequesterType } from '../types';

export const SupportPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [requesterFilter, setRequesterFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Active Ticket Drawer / Modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const refreshList = async () => {
    setIsLoading(true);
    try {
      const data = await supportService.fetchTickets(statusFilter);
      setTickets(data);
    } catch (err) {
      console.warn('Erro ao carregar tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchReq = requesterFilter === 'all' || t.requesterType === requesterFilter;
      return matchSearch && matchStatus && matchPriority && matchReq;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, requesterFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadgeVariant = (status: TicketStatus): BadgeVariant => {
    switch (status) {
      case 'Aberto':
        return 'danger';
      case 'Em atendimento':
        return 'warning';
      case 'Aguardando resposta':
        return 'purple';
      case 'Resolvido':
        return 'success';
      case 'Encerrado':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getPriorityBadgeVariant = (priority: TicketPriority): BadgeVariant => {
    switch (priority) {
      case 'Urgente':
        return 'danger';
      case 'Alta':
        return 'warning';
      case 'Média':
        return 'info';
      case 'Baixa':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await supportService.replyTicket(activeTicket.id, replyText, currentUser);
      success('Resposta enviada no chamado com sucesso!');
      setReplyText('');
      refreshList();
      if (updated) setActiveTicket(updated);
    } catch (err: any) {
      error('Falha ao enviar resposta:', err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    try {
      const updated = await supportService.closeTicket(activeTicket.id, currentUser);
      success(`Chamado ${activeTicket.code} encerrado com sucesso.`);
      refreshList();
      if (updated) setActiveTicket(updated);
    } catch (err: any) {
      error('Falha ao encerrar chamado:', err.message);
    }
  };

  const handleUpdateStatus = (newStatus: TicketStatus) => {
    if (!activeTicket) return;
    const updated = supportService.updateStatus(activeTicket.id, newStatus, currentUser);
    success(`Status do chamado alterado para "${newStatus}".`);
    refreshList();
    if (updated) setActiveTicket(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Central de Atendimento & Suporte
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {tickets.length} chamados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de tickets abertos por clientes, restaurantes parceiros e entregadores do Oba Comida.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código (#TK-...), solicitante ou assunto..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
          >
            <option value="all">Status: Todos</option>
            <option value="Aberto">Aberto</option>
            <option value="Em atendimento">Em atendimento</option>
            <option value="Aguardando resposta">Aguardando resposta</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Encerrado">Encerrado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
          >
            <option value="all">Prioridade: Todas</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          <select
            value={requesterFilter}
            onChange={(e) => {
              setRequesterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
          >
            <option value="all">Solicitante: Todos</option>
            <option value="Cliente">Cliente</option>
            <option value="Restaurante">Restaurante</option>
            <option value="Entregador">Entregador</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Assunto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-orange-600 font-mono">
                    {t.code}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {t.requesterName}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                      {t.requesterType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                    {t.subject}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">{t.category}</td>
                  <td className="py-3.5 px-4 text-slate-700">{t.assignedTo}</td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getPriorityBadgeVariant(t.priority)} size="sm">
                      {t.priority}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={getStatusBadgeVariant(t.status)} dot size="sm">
                      {t.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveTicket(t)}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Atender
                    </button>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum chamado de suporte encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Ticket Details & Chat Modal */}
      {activeTicket && (
        <Modal
          isOpen={!!activeTicket}
          onClose={() => setActiveTicket(null)}
          title={`Chamado ${activeTicket.code}: ${activeTicket.subject}`}
          subtitle={`Solicitante: ${activeTicket.requesterName} (${activeTicket.requesterType}) • Categoria: ${activeTicket.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Alterar Status:</span>
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                  className="bg-white border border-slate-300 rounded-lg py-1 px-2 font-bold text-slate-800"
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em atendimento">Em atendimento</option>
                  <option value="Aguardando resposta">Aguardando resposta</option>
                  <option value="Resolvido">Resolvido</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {activeTicket.status !== 'Encerrado' && (
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                    title="Encerrar chamado via API (PATCH /api/v1/support/tickets/{id}/close)"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Encerrar Chamado</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-slate-500 font-semibold">Prioridade:</span>
                  <Badge variant={getPriorityBadgeVariant(activeTicket.priority)}>
                    {activeTicket.priority}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-2">
              {activeTicket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.isStaff ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      m.isStaff
                        ? 'bg-orange-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    <p className={`text-[10px] font-bold mb-1 ${m.isStaff ? 'text-orange-200' : 'text-slate-500'}`}>
                      {m.sender}
                    </p>
                    <p className="text-xs leading-relaxed">{m.text}</p>
                    <span className={`text-[9px] block text-right mt-1 ${m.isStaff ? 'text-orange-200' : 'text-slate-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreva uma resposta oficial ao solicitante..."
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={isSendingReply}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Send className={`w-4 h-4 ${isSendingReply ? 'animate-spin' : ''}`} />
                <span>{isSendingReply ? 'Enviando...' : 'Responder'}</span>
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
