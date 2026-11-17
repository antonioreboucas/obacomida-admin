import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonValue?: string;
  onReasonChange?: (val: string) => void;
  reasonPlaceholder?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  requireReason = false,
  reasonValue = '',
  onReasonChange,
  reasonPlaceholder = 'Informe a justificativa desta ação administrativa...',
  isLoading = false,
}) => {
  const confirmBtnStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-orange-600 hover:bg-orange-700 text-white',
  }[variant];

  const Icon = variant === 'danger' ? AlertCircle : AlertTriangle;
  const iconColor = variant === 'danger' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || (requireReason && !reasonValue.trim())}
            className={`px-4 py-2 text-sm font-medium rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtnStyles}`}
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>

      {requireReason && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Justificativa Administrativa <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reasonValue}
            onChange={(e) => onReasonChange?.(e.target.value)}
            rows={3}
            placeholder={reasonPlaceholder}
            className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      )}
    </Modal>
  );
};
