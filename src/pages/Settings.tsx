import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Building2,
  DollarSign,
  Palette,
  CreditCard,
  Shield,
  HelpCircle,
  AlertTriangle,
  Globe,
  Smartphone,
  Store,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Link2,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getStoreAppUrl,
  getStorePartnerUrl,
  getStoreAppUrlDisplay,
  getStorePartnerUrlDisplay,
  sanitizeSlug,
} from '../utils/slugUtils';
import type { PlatformSettings, PaymentMethod } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [settings, setSettings] = useState<PlatformSettings>(settingsService.get());
  const [activeTab, setActiveTab] = useState<'general' | 'rates' | 'payments' | 'rules' | 'domains'>('general');

  // Test slug for live domain link previews
  const [testSlug, setTestSlug] = useState('obaburger');
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedPartner, setCopiedPartner] = useState(false);

  const allPaymentMethods: PaymentMethod[] = [
    'Cartão de Crédito',
    'Pix',
    'Dinheiro',
    'Vale Refeição',
  ];

  const handleTogglePayment = (method: PaymentMethod) => {
    const current = settings.allowedPaymentMethods;
    let updated: PaymentMethod[];
    if (current.includes(method)) {
      if (current.length === 1) return; // Keep at least one
      updated = current.filter((m) => m !== method);
    } else {
      updated = [...current, method];
    }
    setSettings({ ...settings, allowedPaymentMethods: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.update(settings, currentUser);
    success('Configurações globais salvas com sucesso!', 'Os novos domínios e parâmetros já estão em vigor.');
  };

  const handleFactoryReset = () => {
    if (
      confirm(
        'ATENÇÃO: Deseja realmente restaurar todos os dados da plataforma aos padrões de fábrica? Todos os cadastros e simulações serão redefinidos.'
      )
    ) {
      settingsService.resetDefaults(currentUser);
      setSettings(settingsService.get());
      success('Banco de dados restaurado aos padrões originais!');
    }
  };

  // Domain Presets
  const applyPreset = (preset: 'obacomida' | 'subdomains' | 'vercel' | 'localhost') => {
    switch (preset) {
      case 'obacomida':
        setSettings({
          ...settings,
          appDomain: 'obacomida.com.br',
          appProtocol: 'https',
          appPathPattern: '/{slug}-app',
          partnerDomain: 'obacomida.com.br',
          partnerProtocol: 'https',
          partnerPathPattern: '/{slug}',
        });
        info('Preset aplicado', 'Padrão Oficial Oba Comida configurado.');
        break;
      case 'subdomains':
        setSettings({
          ...settings,
          appDomain: 'app.obacomida.com.br',
          appProtocol: 'https',
          appPathPattern: '/{slug}',
          partnerDomain: 'parceiro.obacomida.com.br',
          partnerProtocol: 'https',
          partnerPathPattern: '/{slug}',
        });
        info('Preset aplicado', 'Subdomínios dedicados (app. e parceiro.) configurados.');
        break;
      case 'vercel':
        setSettings({
          ...settings,
          appDomain: 'obacomida-app.vercel.app',
          appProtocol: 'https',
          appPathPattern: '/{slug}-app',
          partnerDomain: 'obacomida-partner.vercel.app',
          partnerProtocol: 'https',
          partnerPathPattern: '/{slug}',
        });
        info('Preset aplicado', 'URLs temporárias de deploy (Vercel) configuradas.');
        break;
      case 'localhost':
        setSettings({
          ...settings,
          appDomain: 'localhost:5173',
          appProtocol: 'http',
          appPathPattern: '/{slug}-app',
          partnerDomain: 'localhost:5174',
          partnerProtocol: 'http',
          partnerPathPattern: '/{slug}',
        });
        info('Preset aplicado', 'Ambiente de desenvolvimento local (localhost) configurado.');
        break;
    }
  };

  // Live generated URLs with current settings state
  const liveAppUrl = getStoreAppUrl(testSlug, settings);
  const livePartnerUrl = getStorePartnerUrl(testSlug, settings);
  const liveAppDisplay = getStoreAppUrlDisplay(testSlug, settings);
  const livePartnerDisplay = getStorePartnerUrlDisplay(testSlug, settings);

  const handleCopyTestApp = () => {
    navigator.clipboard.writeText(liveAppUrl);
    setCopiedApp(true);
    success('Link do App copiado!');
    setTimeout(() => setCopiedApp(false), 2000);
  };

  const handleCopyTestPartner = () => {
    navigator.clipboard.writeText(livePartnerUrl);
    setCopiedPartner(true);
    success('Link do Parceiro copiado!');
    setTimeout(() => setCopiedPartner(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Configurações Globais da Plataforma
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Superadmin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Parâmetros operacionais, taxas do marketplace, domínios de acesso e identidade visual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFactoryReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões de Fábrica</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'general', label: 'Identidade & Contato', icon: Building2 },
          { id: 'domains', label: 'Domínios & Links das Lojas', icon: Globe },
          { id: 'rates', label: 'Taxas & Comissões Padrão', icon: DollarSign },
          { id: 'payments', label: 'Formas de Pagamento', icon: CreditCard },
          { id: 'rules', label: 'Regras Operacionais', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ==================================================== */}
        {/* TAB: DOMÍNIOS & LINKS DAS LOJAS                     */}
        {/* ==================================================== */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            {/* Informative Guidance Card */}
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/40 p-5 rounded-2xl border border-orange-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Configuração Flexível de Domínios para App e Parceiros
                  </h4>
                  <p className="leading-relaxed text-slate-600">
                    Como você ainda não definiu um domínio oficial definitivo, você pode cadastrar aqui exatamente onde cada aplicação está rodando (seja um domínio próprio, subdomínio, deploy na Vercel/Railway ou até <code>localhost</code> para testes).
                  </p>
                  <p className="text-[11px] text-orange-700 font-semibold pt-1">
                    💡 Todos os links gerados para os restaurantes cadastrados no painel serão atualizados automaticamente com base nesta configuração.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Atalhos Rápidos de Configuração (Presets)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Clique para preencher os campos automaticamente:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyPreset('obacomida')}
                  className="p-3 text-left rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/60 transition-colors group"
                >
                  <p className="text-xs font-bold text-orange-950 group-hover:text-orange-600">
                    1. Oficial Oba Comida
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    obacomida.com.br/{'{slug}'}-app
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('subdomains')}
                  className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">
                    2. Subdomínios Dedicados
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    app. / parceiro.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('vercel')}
                  className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">
                    3. Vercel / Cloudflare
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    *.vercel.app
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('localhost')}
                  className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600">
                    4. Ambiente Local (Dev)
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    localhost:5173 / :5174
                  </p>
                </button>
              </div>
            </div>

            {/* Domains Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. App do Consumidor Config */}
              <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-orange-600 text-white shadow-xs">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        1. Aplicativo do Consumidor (App)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Onde o cliente acessa o marketplace e o cardápio da loja
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Cliente Final
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Protocolo</label>
                      <select
                        value={settings.appProtocol || 'https'}
                        onChange={(e) =>
                          setSettings({ ...settings, appProtocol: e.target.value as any })
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="https">https:// (Produção)</option>
                        <option value="http">http:// (Local / Dev)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Domínio Base do App *
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.appDomain || ''}
                        onChange={(e) => setSettings({ ...settings, appDomain: e.target.value })}
                        placeholder="ex: obacomida.com.br ou app.obacomida.com.br"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Padrão de Rota da Loja no App *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.appPathPattern || '/{slug}-app'}
                      onChange={(e) =>
                        setSettings({ ...settings, appPathPattern: e.target.value })
                      }
                      placeholder="/{slug}-app"
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">Sugestões de rota:</span>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, appPathPattern: '/{slug}-app' })}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /{'{slug}'}-app
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, appPathPattern: '/{slug}' })}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /{'{slug}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, appPathPattern: '/loja/{slug}' })}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /loja/{'{slug}'}
                      </button>
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div className="mt-4 p-3.5 bg-orange-50/60 rounded-xl border border-orange-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">
                      Pré-visualização do Link do App:
                    </span>
                    <p className="text-xs font-mono font-bold text-orange-950 truncate select-all">
                      {liveAppUrl}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Exibição simplificada: <code>{liveAppDisplay}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Painel do Parceiro Config */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-slate-800 text-white shadow-xs">
                      <Store className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        2. Painel do Parceiro (Restaurante)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Portal onde o restaurante gerencia pedidos em tempo real e cardápio
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Lojista
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Protocolo</label>
                      <select
                        value={settings.partnerProtocol || 'https'}
                        onChange={(e) =>
                          setSettings({ ...settings, partnerProtocol: e.target.value as any })
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="https">https:// (Produção)</option>
                        <option value="http">http:// (Local / Dev)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Domínio Base do Parceiro *
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.partnerDomain || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, partnerDomain: e.target.value })
                        }
                        placeholder="ex: obacomida.com.br ou parceiro.obacomida.com.br"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Padrão de Rota da Loja no Parceiro *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.partnerPathPattern || '/{slug}'}
                      onChange={(e) =>
                        setSettings({ ...settings, partnerPathPattern: e.target.value })
                      }
                      placeholder="/{slug}"
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400">Sugestões de rota:</span>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, partnerPathPattern: '/{slug}' })}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /{'{slug}'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, partnerPathPattern: '/painel/{slug}' })
                        }
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /painel/{'{slug}'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, partnerPathPattern: '/loja/{slug}' })
                        }
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        /loja/{'{slug}'}
                      </button>
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                      Pré-visualização do Link do Parceiro:
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-900 truncate select-all">
                      {livePartnerUrl}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Exibição simplificada: <code>{livePartnerDisplay}</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Testing Playground */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-orange-600" />
                    <span>Simulador de Geração de Links por Loja</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Digite qualquer identificador (slug) para conferir os links gerados em tempo real:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Slug de teste:</span>
                  <input
                    type="text"
                    value={testSlug}
                    onChange={(e) => setTestSlug(sanitizeSlug(e.target.value) || 'loja')}
                    placeholder="ex: obaburger"
                    className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl w-36 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-orange-600 block uppercase">
                      Link do App
                    </span>
                    <span className="text-xs font-mono text-slate-800 truncate block select-all">
                      {liveAppUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTestApp}
                    className="px-2.5 py-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                  >
                    {copiedApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedApp ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-600 block uppercase">
                      Link do Painel Parceiro
                    </span>
                    <span className="text-xs font-mono text-slate-800 truncate block select-all">
                      {livePartnerUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTestPartner}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                  >
                    {copiedPartner ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPartner ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: GENERAL / IDENTITY                              */}
        {/* ==================================================== */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Identidade Visual & Contato Institucional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Plataforma *
                </label>
                <input
                  type="text"
                  required
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail Oficial de Suporte
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefone de Contato / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Horário de Operação do Suporte
                </label>
                <input
                  type="text"
                  value={settings.supportOperatingHours}
                  onChange={(e) =>
                    setSettings({ ...settings, supportOperatingHours: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: RATES & COMMISSIONS                             */}
        {/* ==================================================== */}
        {activeTab === 'rates' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Taxas Padrão de Marketplace (Novos Cadastros)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comissão Padrão da Plataforma (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    required
                    value={settings.defaultCommissionRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultCommissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Aplicada sobre o valor dos produtos em cada pedido aprovado. Pode ser personalizada por restaurante.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taxa Fixa por Pedido Concluído (R$) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={settings.defaultFixedFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultFixedFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">R$</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Custo fixo de processamento descontado do repasse do restaurante.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taxa de Serviço Cobrada do Cliente (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={settings.defaultServiceFeeRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultServiceFeeRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pequena taxa de conveniência somada ao checkout do consumidor.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pedido Mínimo Sugerido Padrão (R$)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={settings.minOrderValueDefault}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minOrderValueDefault: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">R$</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: PAYMENT METHODS                                 */}
        {/* ==================================================== */}
        {activeTab === 'payments' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Formas de Pagamento Aceitas no Marketplace
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPaymentMethods.map((method) => {
                const isSelected = settings.allowedPaymentMethods.includes(method);
                return (
                  <div
                    key={method}
                    onClick={() => handleTogglePayment(method)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/30'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{method}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isSelected ? 'Habilitado no aplicativo' : 'Desabilitado no checkout'}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by container
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: OPERATIONAL RULES                               */}
        {/* ==================================================== */}
        {activeTab === 'rules' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Regras Gerais de Operação & Segurança
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900">Aprovação Automática de Novos Estabelecimentos</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Se desativado, todo novo parceiro ficará com status "Pendente" aguardando homologação manual da equipe.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveNewRestaurants}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveNewRestaurants: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900">Modo de Manutenção da Plataforma</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bloqueia novos pedidos no app de clientes exibindo aviso operacional.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações Globais</span>
          </button>
        </div>
      </form>
    </div>
  );
};
