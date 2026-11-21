import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

interface StatusBadgeProps {
  status: string;
  type?: 'restaurant' | 'order' | 'user' | 'ticket' | 'general';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'general',
  size = 'md',
  className = '',
}) => {
  const upper = String(status).toUpperCase();

  let variant: BadgeVariant = 'neutral';
  let label = status;

  if (type === 'restaurant') {
    switch (upper) {
      case 'PENDING':
      case 'PENDENTE':
        variant = 'warning';
        label = 'Pendente';
        break;
      case 'UNDER_REVIEW':
      case 'EM ANÁLISE':
        variant = 'info';
        label = 'Em análise';
        break;
      case 'APPROVED':
      case 'APROVADO':
        variant = 'info';
        label = 'Aprovado';
        break;
      case 'ACTIVE':
      case 'ATIVO':
        variant = 'success';
        label = 'Ativo';
        break;
      case 'PAUSED':
      case 'PAUSADO':
        variant = 'neutral';
        label = 'Pausado';
        break;
      case 'SUSPENDED':
      case 'SUSPENSO':
        variant = 'danger';
        label = 'Suspenso';
        break;
      case 'REJECTED':
      case 'REPROVADO':
        variant = 'danger';
        label = 'Reprovado';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'order') {
    switch (upper) {
      case 'PENDING':
      case 'CRIADO':
        variant = 'warning';
        label = 'Pendente';
        break;
      case 'CONFIRMED':
      case 'CONFIRMADO':
        variant = 'info';
        label = 'Confirmado';
        break;
      case 'PREPARING':
      case 'EM PREPARAÇÃO':
        variant = 'info';
        label = 'Em preparação';
        break;
      case 'READY_FOR_PICKUP':
      case 'PRONTO PARA RETIRADA':
        variant = 'purple';
        label = 'Pronto p/ Retirada';
        break;
      case 'OUT_FOR_DELIVERY':
      case 'SAIU PARA ENTREGA':
        variant = 'primary';
        label = 'Saiu p/ Entrega';
        break;
      case 'DELIVERED':
      case 'ENTREGUE':
        variant = 'success';
        label = 'Entregue';
        break;
      case 'CANCELLED':
      case 'CANCELADO':
        variant = 'danger';
        label = 'Cancelado';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'user') {
    if (upper === 'ATIVO' || upper === 'TRUE' || upper === 'ACTIVE') {
      variant = 'success';
      label = 'Ativo';
    } else {
      variant = 'danger';
      label = 'Inativo';
    }
  } else if (type === 'ticket') {
    switch (upper) {
      case 'OPEN':
      case 'ABERTO':
        variant = 'warning';
        label = 'Aberto';
        break;
      case 'IN_PROGRESS':
      case 'EM ATENDIMENTO':
        variant = 'info';
        label = 'Em atendimento';
        break;
      case 'RESOLVED':
      case 'RESOLVIDO':
        variant = 'success';
        label = 'Resolvido';
        break;
      case 'CLOSED':
      case 'ENCERRADO':
        variant = 'neutral';
        label = 'Encerrado';
        break;
      default:
        variant = 'neutral';
    }
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
