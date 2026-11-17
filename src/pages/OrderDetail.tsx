import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Store,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Sliders,
  Plus,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Order, OrderStatus } from '../types';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [order, setOrder] = useState<Order | undefined>(() => orderService.getById(orderId));

  // Change Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order?.status || 'Criado');
  const [statusNote, setStatusNote] = useState('');

  // Cancel Dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // New Occurrence Modal
  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [occurrenceType, setOccurrenceType] = useState('Atraso no Preparo');
  const [occurrenceDesc, setOccurrenceDesc] = useState('');

  const refreshOrder = () => {
    setOrder(orderService.getById(orderId));
  };

  if (!order) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Pedido não encontrado.</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-orange-600 hover:underline">
          ← Voltar para listagem de pedidos
        </button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'Entregue':
        return 'success';
      case 'Saiu para entrega':
        return 'info';
      case 'Em preparação':
        return 'warning';
      case 'Confirmado':
        return 'purple';
      case 'Criado':
        return 'primary';
      case 'Cancelado':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    orderService.updateStatus(order.id, newStatus, currentUser, statusNote);
    success(`Status do pedido ${order.code} atualizado para "${newStatus}"!`);
    setIsStatusModalOpen(false);
    setStatusNote('');
    refreshOrder();
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      error('Informe o motivo do cancelamento.');
      return;
    }
    orderService.cancelOrder(order.id, cancelReason, currentUser);
    success(`Pedido ${order.code} cancelado com sucesso.`);
    setIsCancelOpen(false);
    setCancelReason('');
    refreshOrder();
  };

  const handleAddOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!occurrenceDesc.trim()) {
      error('Descreva os detalhes da ocorrência.');
      return;
    }
    orderService.addOccurrence(order.id, occurrenceType, occurrenceDesc, currentUser);
    success('Ocorrência registrada no histórico do pedido!');
    setIsOccurrenceModalOpen(false);
    setOccurrenceDesc('');
    refreshOrder();
  };

  const handleResolveOccurrence = (occId: string) => {
    const note = prompt('Informe a nota de resolução da ocorrência:') || 'Resolvido pela administração.';
    orderService.resolveOccurrence(order.id, occId, note, currentUser);
    success('Ocorrência marcada como resolvida.');
    refreshOrder();
  };

  return (
    <div className="space-y-6">
      {/* Top back button & Interventions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Pedidos</span>
        </button>

        <div className="flex items-center gap-2">
          {order.status !== 'Cancelado' && order.status !== 'Entregue' && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 text-xs font-bold transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancelar Pedido</span>
            </button>
          )}

          <button
            onClick={() => setIsOccurrenceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl border border-amber-200 text-xs font-bold transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Registrar Ocorrência</span>
          </button>

          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Sliders className="w-4 h-4" />
            <span>Intervir no Status</span>
          </button>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pedido {order.code}
              </h1>
              <Badge variant={getStatusBadgeVariant(order.status)} dot>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Criado em {new Date(order.createdAt).toLocaleString('pt-BR')} • {order.city}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Valor Total</span>
            <span className="text-2xl font-black text-slate-900">R$ {order.totalAmount.toFixed(2)}</span>
            <span className="text-[11px] text-slate-500 block">{order.paymentMethod} • {order.deliveryType}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 text-xs">
          {/* Customer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <User className="w-4 h-4 text-orange-600" /> Dados do Consumidor
            </div>
            <div>
              <p className="font-semibold text-slate-800">{order.customerName}</p>
              <p className="text-slate-500">{order.customerPhone}</p>
              <p className="text-slate-600 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </p>
            </div>
          </div>

          {/* Restaurant */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Store className="w-4 h-4 text-orange-600" /> Estabelecimento
            </div>
            <div>
              <p className="font-semibold text-slate-800">{order.restaurantName}</p>
              <p className="text-slate-500">Cidade: {order.city}</p>
              <p className="text-slate-600 mt-1">
                Modalidade: <strong className="text-slate-800">{order.deliveryType}</strong>
              </p>
            </div>
          </div>

          {/* Financials */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CreditCard className="w-4 h-4 text-orange-600" /> Decomposição Financeira
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal dos itens:</span>
                <span className="font-semibold text-slate-800">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxa de Entrega:</span>
                <span className="font-semibold text-slate-800">R$ {order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxa de Serviço:</span>
                <span className="font-semibold text-slate-800">R$ {order.serviceFee.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto aplicado:</span>
                  <span>- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Items & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-orange-600" /> Itens do Pedido ({order.items.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    <span className="text-orange-600 mr-1.5">{item.quantity}x</span>
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Preço unitário: R$ {item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  R$ {item.totalPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-orange-600" /> Histórico de Movimentações
          </h3>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {order.statusHistory.map((hist, idx) => (
              <div key={idx} className="relative text-xs">
                <div
                  className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                    hist.status === 'Cancelado'
                      ? 'bg-rose-600'
                      : hist.status === 'Entregue'
                      ? 'bg-emerald-600'
                      : 'bg-orange-600'
                  }`}
                />
                <p className="font-bold text-slate-900">{hist.status}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(hist.timestamp).toLocaleString('pt-BR')}
                  {hist.adminName && ` • Por ${hist.adminName}`}
                </p>
                {hist.note && (
                  <p className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{hist.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occurrences Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Ocorrências Registradas
          </h3>
          <button
            onClick={() => setIsOccurrenceModalOpen(true)}
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            + Adicionar Ocorrência
          </button>
        </div>

        <div className="space-y-3">
          {order.occurrences.map((occ) => (
            <div
              key={occ.id}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                occ.resolved ? 'bg-slate-50/70 border-slate-200' : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{occ.type}</span>
                  <Badge variant={occ.resolved ? 'success' : 'warning'}>
                    {occ.resolved ? 'Resolvida' : 'Em Aberto'}
                  </Badge>
                </div>
                {!occ.resolved && (
                  <button
                    onClick={() => handleResolveOccurrence(occ.id)}
                    className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Resolver Ocorrência
                  </button>
                )}
              </div>
              <p className="text-slate-700">{occ.description}</p>
              {occ.resolutionNote && (
                <p className="text-emerald-700 font-medium text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  Resolução: {occ.resolutionNote}
                </p>
              )}
              <span className="text-[10px] text-slate-400 block">
                Registrado em {new Date(occ.date).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}

          {order.occurrences.length === 0 && (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma ocorrência registrada neste pedido.
            </p>
          )}
        </div>
      </div>

      {/* Intervene Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Intervenção Administrativa de Status"
        subtitle={`Pedido ${order.code} • Restaurante ${order.restaurantName}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Novo Status do Pedido *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="Criado">Criado</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Em preparação">Em preparação</option>
              <option value="Saiu para entrega">Saiu para entrega</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nota / Justificativa da Intervenção
            </label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Ex: Intervenção solicitada pelo suporte após contato com o entregador..."
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Atualizar Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancelar Pedido Administrativamente"
        message={`Tem certeza que deseja cancelar o pedido ${order.code}? Um registro de auditoria e estorno simulado serão gerados.`}
        variant="danger"
        requireReason
        reasonValue={cancelReason}
        onReasonChange={setCancelReason}
        reasonPlaceholder="Informe o motivo do cancelamento (ex: atraso excessivo, extravio)..."
        confirmText="Confirmar Cancelamento"
      />

      {/* New Occurrence Modal */}
      <Modal
        isOpen={isOccurrenceModalOpen}
        onClose={() => setIsOccurrenceModalOpen(false)}
        title="Registrar Nova Ocorrência"
        subtitle={`Pedido ${order.code}`}
      >
        <form onSubmit={handleAddOccurrence} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo da Ocorrência *
            </label>
            <select
              value={occurrenceType}
              onChange={(e) => setOccurrenceType(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="Atraso no Preparo">Atraso no Preparo</option>
              <option value="Atraso na Entrega">Atraso na Entrega</option>
              <option value="Item Incorreto ou Faltando">Item Incorreto ou Faltando</option>
              <option value="Endereço Não Localizado">Endereço Não Localizado</option>
              <option value="Problema no Pagamento">Problema no Pagamento</option>
              <option value="Embalagem Danificada">Embalagem Danificada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Ocorrência *
            </label>
            <textarea
              required
              rows={3}
              value={occurrenceDesc}
              onChange={(e) => setOccurrenceDesc(e.target.value)}
              placeholder="Descreva o que ocorreu e as providências tomadas..."
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOccurrenceModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
            >
              Salvar Ocorrência
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
