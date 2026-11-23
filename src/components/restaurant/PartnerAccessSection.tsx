import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  Mail,
  Store,
} from 'lucide-react';
import { partnerAccessService, generateSecurePassword } from '../../services/partnerAccessService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getStorePartnerUrl, getStorePartnerUrlDisplay } from '../../utils/slugUtils';
import { maskPhone } from '../../utils/maskUtils';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Restaurant, PartnerAccess } from '../../types';

interface PartnerAccessSectionProps {
  restaurant: Restaurant;
  onRefreshRestaurant?: () => void;
}

export const PartnerAccessSection: React.FC<PartnerAccessSectionProps> = ({
  restaurant,
  onRefreshRestaurant,
}) => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [access, setAccess] = useState<PartnerAccess | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Creation form state
  const [createEmail, setCreateEmail] = useState(restaurant.email || '');
  const [createOwner, setCreateOwner] = useState(restaurant.ownerName || '');
  const [createPhone, setCreatePhone] = useState(restaurant.phone || '');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Reset password modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Block/unblock confirm dialog state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [targetNextStatus, setTargetNextStatus] = useState<'Ativo' | 'Bloqueado'>('Bloqueado');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Copy feedbacks
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedPartnerUrl, setCopiedPartnerUrl] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showPlainPassword, setShowPlainPassword] = useState(false);

  const partnerUrl = getStorePartnerUrl(restaurant.slug);
  const partnerDisplayUrl = getStorePartnerUrlDisplay(restaurant.slug);

  const loadAccess = async () => {
    setIsLoading(true);
    try {
      const data = await partnerAccessService.getAccess(restaurant.id, restaurant.email);
      setAccess(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccess();
    setCreateEmail(restaurant.email || '');
    setCreateOwner(restaurant.ownerName || '');
    setCreatePhone(restaurant.phone || '');
    setCreatePassword(generateSecurePassword());
  }, [restaurant.id, restaurant.email, restaurant.ownerName, restaurant.phone]);

  const handleGenerateCreatePassword = () => {
    setCreatePassword(generateSecurePassword());
  };

  const handleGenerateResetPassword = () => {
    setResetPasswordInput(generateSecurePassword());
  };

  // Submit create access
  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim()) {
      error('Informe um e-mail válido para o lojista.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await partnerAccessService.createAccess(
        {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          ownerName: createOwner || restaurant.name,
          email: createEmail,
          phone: createPhone,
          password: createPassword,
        },
        currentUser
      );

      setAccess(res.access);
      if (res.syncedApi) {
        success('Acesso do parceiro criado com sucesso na API central!', 'O lojista já pode efetuar login no painel.');
      } else {
        info('Acesso configurado com sucesso!', 'As credenciais foram salvas e já podem ser enviadas ao lojista.');
      }
      onRefreshRestaurant?.();
    } catch (err: any) {
      error(err?.message || 'Falha ao criar credenciais de acesso.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Submit reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordInput.trim()) {
      error('A senha não pode estar em branco.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await partnerAccessService.resetPassword(
        restaurant.id,
        resetPasswordInput,
        currentUser
      );

      setAccess(res.access);
      setIsResetOpen(false);
      setResetPasswordInput('');
      success('Senha redefinida com sucesso!', 'A nova senha temporária já está pronta para envio.');
      onRefreshRestaurant?.();
    } catch (err: any) {
      error(err?.message || 'Erro ao redefinir senha do lojista.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Submit toggle status
  const handleToggleStatus = async () => {
    setIsSubmittingStatus(true);
    try {
      const res = await partnerAccessService.toggleAccessStatus(
        restaurant.id,
        targetNextStatus,
        currentUser
      );
      setAccess(res.access);
      setIsStatusDialogOpen(false);
      success(
        `Acesso ${targetNextStatus === 'Ativo' ? 'reativado' : 'suspenso'} com sucesso!`,
        `O lojista ${targetNextStatus === 'Ativo' ? 'agora pode' : 'não conseguirá mais'} acessar o Painel do Parceiro.`
      );
      onRefreshRestaurant?.();
    } catch (err: any) {
      error(err?.message || 'Falha ao alterar status de acesso.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Quick copy helpers
  const handleCopyEmail = () => {
    if (!access?.email) return;
    navigator.clipboard.writeText(access.email);
    setCopiedEmail(true);
    success('E-mail copiado!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPassword = () => {
    if (!access?.temporaryPassword) return;
    navigator.clipboard.writeText(access.temporaryPassword);
    setCopiedPassword(true);
    success('Senha provisória copiada!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyPartnerUrl = () => {
    navigator.clipboard.writeText(partnerUrl);
    setCopiedPartnerUrl(true);
    success('Link do Painel copiado!');
    setTimeout(() => setCopiedPartnerUrl(false), 2000);
  };

  const inviteMessage = access
    ? partnerAccessService.formatInviteMessage(access, partnerUrl)
    : '';

  const handleCopyFullMessage = () => {
    if (!inviteMessage) return;
    navigator.clipboard.writeText(inviteMessage);
    setCopiedMessage(true);
    success('Mensagem completa copiada!', 'Pronta para colar e enviar no WhatsApp ou E-mail.');
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const whatsAppUrl = partnerAccessService.getWhatsAppUrl(
    access?.phone || restaurant.phone,
    inviteMessage
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xs border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-2xl shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Acesso ao Painel do Parceiro
                </h3>
                {access ? (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      access.status === 'Ativo'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {access.status === 'Ativo' ? '● Acesso Ativo' : '✕ Acesso Bloqueado'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ⚠ Sem Acesso Configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Gerencie as credenciais de login do restaurante para acessar o portal do lojista{' '}
                <code className="text-orange-300 font-mono text-[11px]">{partnerDisplayUrl}</code>,
                redefina senhas provisórias e envie dados de acesso com 1 clique para WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={partnerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-colors shadow-2xs"
              title="Abrir o painel do parceiro em uma nova aba"
            >
              <ExternalLink className="w-4 h-4 text-orange-400" />
              <span>Abrir Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Carregando credenciais de acesso...</p>
        </div>
      ) : !access ? (
        /* Empty State: Create Access Form */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-dashed border-slate-300 shadow-xs space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto shadow-2xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Liberar Primeiro Acesso ao Painel do Parceiro
            </h4>
            <p className="text-xs text-slate-500">
              O lojista de <strong>{restaurant.name}</strong> ainda não possui credenciais criadas. Preencha ou confirme os dados abaixo para gerar a senha e liberar o acesso.
            </p>
          </div>

          <form onSubmit={handleCreateAccess} className="max-w-xl mx-auto space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Responsável / Gestor *
                </label>
                <input
                  type="text"
                  required
                  value={createOwner}
                  onChange={(e) => setCreateOwner(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  WhatsApp / Telefone para Envio *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={createPhone}
                  onChange={(e) => setCreatePhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  E-mail Oficial de Login do Lojista *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="contato@restaurante.com.br"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Este será o e-mail de login que o restaurante usará para entrar no Painel do Parceiro.
                </p>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Senha Provisória do Parceiro *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCreatePassword}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Outra Senha</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pr-20 pl-3 py-2.5 border border-slate-300 rounded-xl font-mono text-sm tracking-wide bg-orange-50/30 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2 px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Senha segura sugerida: <code className="font-mono text-orange-950 bg-orange-100/70 px-1.5 py-0.5 rounded">{createPassword}</code>
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmittingCreate ? 'Criando Acesso...' : 'Criar Acesso e Liberar Painel'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Active Access Management View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Identificação de Acesso */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span>Dados do Operador</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    access.status === 'Ativo'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {access.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Login / E-mail de Acesso
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5 p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-900">
                    <span className="truncate select-all font-semibold">{access.email}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-1 hover:bg-white text-slate-500 hover:text-slate-800 rounded transition-colors shrink-0"
                      title="Copiar e-mail"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Responsável
                    </span>
                    <span className="font-semibold text-slate-800 block truncate mt-0.5">
                      {access.ownerName || restaurant.ownerName || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      WhatsApp
                    </span>
                    <span className="font-mono text-slate-800 block truncate mt-0.5">
                      {access.phone || restaurant.phone || 'Não informado'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
                  <p>
                    Acesso criado em:{' '}
                    <span className="text-slate-600 font-medium">
                      {new Date(access.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                  {access.lastUpdatedBy && (
                    <p>
                      Última atualização por:{' '}
                      <span className="text-slate-600 font-medium">{access.lastUpdatedBy}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Senha & Ações de Segurança */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span>Credencial de Senha</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Provisória</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Senha Atual Cadastrada
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPlainPassword(!showPlainPassword)}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      {showPlainPassword ? 'Ocultar' : 'Exibir Senha'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-orange-50/40 rounded-xl border border-orange-200 font-mono text-orange-950 font-bold">
                    <span className="truncate select-all text-sm">
                      {showPlainPassword
                        ? access.temporaryPassword || '••••••••'
                        : access.temporaryPassword
                        ? '••••••••••••'
                        : 'Não disponível'}
                    </span>
                    {access.temporaryPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 hover:bg-orange-100 text-orange-700 rounded transition-colors shrink-0"
                        title="Copiar senha"
                      >
                        {copiedPassword ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordInput(generateSecurePassword());
                      setIsResetOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Redefinir / Gerar Nova Senha</span>
                  </button>

                  {access.status === 'Ativo' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetNextStatus('Bloqueado');
                        setIsStatusDialogOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Suspender Acesso ao Painel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetNextStatus('Ativo');
                        setIsStatusDialogOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Reativar Acesso do Lojista</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Link do Painel & Compartilhamento */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-orange-600" />
                  <span>Portal do Lojista</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Acesso Web</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    URL de Acesso ao Painel
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5 p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-800 text-[11px]">
                    <span className="truncate select-all">{partnerDisplayUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyPartnerUrl}
                      className="p-1 hover:bg-white text-slate-500 hover:text-slate-800 rounded transition-colors shrink-0"
                      title="Copiar URL do Painel"
                    >
                      {copiedPartnerUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {whatsAppUrl ? (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Acesso via WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCopyFullMessage}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar Dados para WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyFullMessage}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedMessage ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto Completo de Convite'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp / Email Invite Preview Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Prévia da Mensagem de Acesso Formatada para o Lojista</span>
              </span>
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Copiado!' : 'Copiar Mensagem'}</span>
              </button>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed select-all">
              {inviteMessage}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Redefinir Senha do Painel do Parceiro"
        subtitle={`Gerar nova senha provisória de acesso para ${restaurant.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ao gerar uma nova senha, a anterior deixará de funcionar imediatamente. Certifique-se de compartilhar a nova credencial com o lojista via WhatsApp ou e-mail.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Nova Senha Temporária *
              </label>
              <button
                type="button"
                onClick={handleGenerateResetPassword}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Senha Automática</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showResetPassword ? 'text' : 'password'}
                required
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full pr-20 pl-3 py-2.5 border border-slate-300 rounded-xl font-mono text-sm tracking-wide bg-orange-50/20 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-2 px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Senha gerada: <code className="font-mono text-orange-950 font-bold">{resetPasswordInput}</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingReset}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmittingReset ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog: Bloquear ou Reativar Acesso */}
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={handleToggleStatus}
        title={targetNextStatus === 'Bloqueado' ? 'Suspender Acesso do Lojista?' : 'Reativar Acesso do Lojista?'}
        message={
          targetNextStatus === 'Bloqueado'
            ? `Tem certeza que deseja suspender o login de "${access?.email || restaurant.name}" no Painel do Parceiro? O lojista não conseguirá gerenciar pedidos ou cardápio até ser reativado.`
            : `Deseja reativar o login de "${access?.email || restaurant.name}" no Painel do Parceiro? O lojista voltará a ter acesso normal com sua senha.`
        }
        confirmText={targetNextStatus === 'Bloqueado' ? 'Sim, Suspender Acesso' : 'Sim, Reativar Acesso'}
        variant={targetNextStatus === 'Bloqueado' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default PartnerAccessSection;
