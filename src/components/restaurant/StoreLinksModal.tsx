import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  LayoutDashboard,
  QrCode,
  Globe,
  Edit2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { restaurantService } from '../../services/restaurantService';
import {
  sanitizeSlug,
  getStoreAppUrl,
  getStorePartnerUrl,
  getStoreAppUrlDisplay,
  getStorePartnerUrlDisplay,
} from '../../utils/slugUtils';
import type { Restaurant } from '../../types';

interface StoreLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onUpdated?: () => void;
}

export const StoreLinksModal: React.FC<StoreLinksModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onUpdated,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedPartner, setCopiedPartner] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Edit slug state
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState(restaurant.slug || '');
  const [slugError, setSlugError] = useState('');

  const currentSlug = restaurant.slug || '';
  const appDisplayUrl = getStoreAppUrlDisplay(currentSlug);
  const partnerDisplayUrl = getStorePartnerUrlDisplay(currentSlug);
  const appFullUrl = getStoreAppUrl(currentSlug);
  const partnerFullUrl = getStorePartnerUrl(currentSlug);

  const handleCopyApp = () => {
    navigator.clipboard.writeText(appFullUrl);
    setCopiedApp(true);
    success('Link do Aplicativo copiado para a área de transferência!');
    setTimeout(() => setCopiedApp(false), 2000);
  };

  const handleCopyPartner = () => {
    navigator.clipboard.writeText(partnerFullUrl);
    setCopiedPartner(true);
    success('Link do Painel Parceiro copiado para a área de transferência!');
    setTimeout(() => setCopiedPartner(false), 2000);
  };

  const handleSlugChange = (val: string) => {
    const sanitized = sanitizeSlug(val);
    setNewSlug(sanitized);
    if (!sanitized || sanitized.length < 3) {
      setSlugError('O identificador deve conter ao menos 3 caracteres.');
    } else if (!restaurantService.isSlugAvailable(sanitized, restaurant.id)) {
      setSlugError(`O identificador "${sanitized}" já está em uso por outro parceiro.`);
    } else {
      setSlugError('');
    }
  };

  const handleSaveSlug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const res = restaurantService.updateSlug(restaurant.id, newSlug, currentUser);
    if (!res.success) {
      error(res.error || 'Erro ao atualizar o link da loja.');
      return;
    }
    success(`Link da loja atualizado com sucesso para "${newSlug}"!`);
    setIsEditingSlug(false);
    onUpdated?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Links Oficiais & Acessos da Loja"
      subtitle={`Endereços exclusivos de ${restaurant.name} na plataforma Oba Comida`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Informative Header Banner */}
        <div className="p-3.5 bg-orange-50 border border-orange-200/80 rounded-2xl flex items-start gap-3">
          <Globe className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <p className="font-bold text-slate-900">Endereços Web Dedicados</p>
            <p className="mt-0.5 leading-relaxed text-slate-600">
              Cada parceiro possui dois links independentes: o <strong>Aplicativo do Consumidor</strong> (cardápio estilizado com as cores da loja) e o <strong>Painel do Parceiro</strong> (para gestão de pedidos e cardápio pelo lojista).
            </p>
          </div>
        </div>

        {/* 1. APP LINK CARD */}
        <div className="p-4 bg-white rounded-2xl border-2 border-orange-100 shadow-xs hover:border-orange-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-600 text-white shadow-xs">
                <Smartphone className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aplicativo do Consumidor (Cardápio Digital)</h4>
                <p className="text-[11px] text-slate-500">Para clientes fazerem pedidos pelo celular ou navegador</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Personalizado com Tema
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
            <span className="truncate font-semibold text-orange-700 select-all">
              {appDisplayUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyApp}
                className="px-2.5 py-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 rounded-lg border border-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                title="Copiar link do aplicativo"
              >
                {copiedApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApp ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors shadow-2xs"
                title="Ver QR Code do Aplicativo"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* QR Code expansion */}
          {showQrCode && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
              <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-300 flex items-center justify-center shrink-0 shadow-xs">
                {/* Simulated QR Code SVG */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="6" y="6" width="1" height="1" fill="currentColor" />
                  <rect x="17" y="6" width="1" height="1" fill="currentColor" />
                  <rect x="6" y="17" width="1" height="1" fill="currentColor" />
                </svg>
              </div>
              <div className="text-xs text-slate-600 space-y-1 text-center sm:text-left">
                <p className="font-bold text-slate-800">QR Code de Balcão e Mesas</p>
                <p className="text-[11px] text-slate-500">
                  Imprima este código para colocar nas embalagens de entrega, displays de mesa ou cartazes promocionais.
                </p>
                <p className="text-[10px] text-orange-600 font-mono">{appFullUrl}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. PARTNER PORTAL CARD */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-slate-800 text-white shadow-xs">
                <LayoutDashboard className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Painel do Parceiro (Portal do Lojista)</h4>
                <p className="text-[11px] text-slate-500">Para o restaurante gerenciar pedidos recebidos e cardápio</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Acesso Restrito
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
            <span className="truncate font-semibold text-slate-700 select-all">
              {partnerDisplayUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyPartner}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                title="Copiar link do painel parceiro"
              >
                {copiedPartner ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPartner ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. EDIT SLUG ACCORDION */}
        <div className="pt-2 border-t border-slate-100">
          {!isEditingSlug ? (
            <button
              type="button"
              onClick={() => {
                setNewSlug(restaurant.slug || '');
                setIsEditingSlug(true);
              }}
              className="text-xs font-bold text-slate-600 hover:text-orange-600 inline-flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Personalizar ou Alterar o Identificador do Link (Slug)</span>
            </button>
          ) : (
            <form onSubmit={handleSaveSlug} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Alterar Link Oficial da Loja:
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
                  <span className="px-3 py-2 text-xs font-mono text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
                    obacomida.com.br/
                  </span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="nomeloja"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                {slugError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {slugError}
                  </p>
                )}

                {/* Real-time Preview */}
                {!slugError && newSlug.length >= 3 && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] space-y-1 text-emerald-900">
                    <p className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Links resultantes:
                    </p>
                    <p className="font-mono text-[10px]">
                      • App: <span className="font-bold">{getStoreAppUrlDisplay(newSlug)}</span>
                    </p>
                    <p className="font-mono text-[10px]">
                      • Parceiro: <span className="font-bold">{getStorePartnerUrlDisplay(newSlug)}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!slugError || newSlug.length < 3 || newSlug === restaurant.slug}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
                >
                  Salvar Novo Link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};
