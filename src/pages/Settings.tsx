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
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { PlatformSettings, PaymentMethod } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, info } = useToast();

  const [settings, setSettings] = useState<PlatformSettings>(settingsService.get());
  const [activeTab, setActiveTab] = useState<'general' | 'rates' | 'payments' | 'rules'>('general');

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
    success('Configurações globais salvas com sucesso!');
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
            Parâmetros operacionais, taxas do marketplace, meios de pagamento e identidade visual do Oba Comida.
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
        {/* General / Identity */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Identidade Visual & Contato Institucional
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Plataforma *</label>
                <input
                  type="text"
                  required
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social / Empresa</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CNPJ Institucional</label>
                <input
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail de Suporte Geral</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone da Central SAC</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL da Logo</label>
                <input
                  type="url"
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Horário de Funcionamento do Suporte</label>
                <input
                  type="text"
                  value={settings.supportOperatingHours}
                  onChange={(e) => setSettings({ ...settings, supportOperatingHours: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rates & Commissions */}
        {activeTab === 'rates' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Taxas & Comissões Padrão de Homologação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comissão Padrão dos Restaurantes (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.defaultCommissionRate}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultCommissionRate: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Percentual incidente sobre o valor bruto dos pedidos entregues.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taxa Fixa Padrão por Transação (R$)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.defaultFixedFee}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultFixedFee: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Custo fixo de processamento retido de cada pedido.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taxa de Serviço Cobrada do Cliente (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.defaultServiceFeeRate}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultServiceFeeRate: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Adicional de conveniência faturado diretamente pela plataforma.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pedido Mínimo Padrão da Plataforma (R$)
                </label>
                <input
                  type="number"
                  step="1"
                  value={settings.minOrderValueDefault}
                  onChange={(e) =>
                    setSettings({ ...settings, minOrderValueDefault: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {activeTab === 'payments' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Formas de Pagamento Disponíveis no Marketplace
            </h3>
            <p className="text-xs text-slate-500">
              Habilite ou desabilite os métodos aceitos no fechamento dos pedidos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPaymentMethods.map((method) => {
                const isSelected = settings.allowedPaymentMethods.includes(method);
                return (
                  <div
                    key={method}
                    onClick={() => handleTogglePayment(method)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{method}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isSelected ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Operating Rules */}
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
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações Globais</span>
          </button>
        </div>
      </form>
    </div>
  );
};
