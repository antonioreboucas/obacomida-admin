import React, { useState } from 'react';
import {
  Flame,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building2,
  ShoppingBag,
  Sparkles,
  Shield,
  Layers,
  Check,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { db } from '../storage/db';
import { Modal } from '../components/common/Modal';
import type { AdminRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, availableStaff } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('form');
  const [email, setEmail] = useState('carlos.super@obacomida.com.br');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery modal
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  // Dynamic live stats for showcase
  const restaurantsCount = db.getRestaurants().length;
  const ordersCount = db.getOrders().length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const res = await login(email, password, rememberMe);
    setIsLoading(false);

    if (res.success) {
      success('Login realizado com sucesso!', 'Bem-vindo ao Painel Administrativo Oba Comida.');
    } else {
      const err = res.error || 'Credenciais inválidas ou e-mail não cadastrado';
      setErrorMessage(err);
      error('Falha no login', err);
    }
  };

  const handleQuickLogin = async (role: AdminRole) => {
    setErrorMessage(null);
    const user = availableStaff.find((u) => u.role === role && u.status === 'Ativo');
    if (user) {
      setEmail(user.email);
      setPassword('admin123');
      setIsLoading(true);
      const res = await login(user.email, 'admin123', rememberMe);
      setIsLoading(false);
      if (res.success) {
        success(`Autenticado como ${user.name}`, `Nível de acesso: ${role.toUpperCase()}`);
      } else {
        setErrorMessage(res.error || 'Erro na autenticação rápida');
      }
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    setIsRecovering(true);
    const res = await authService.recoverPassword(recoveryEmail);
    setIsRecovering(false);

    if (res.success) {
      setRecoverySent(true);
      info('Instruções enviadas', res.message);
    }
  };

  const resetRecoveryModal = () => {
    setIsRecoveryOpen(false);
    setRecoveryEmail('');
    setRecoverySent(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT COLUMN: Brand Showcase & Operational Highlights */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-950 p-10 xl:p-14 flex-col justify-between border-r border-slate-800/80 relative z-10">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30">
              <Flame className="w-7 h-7 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-2xl text-white tracking-tight">OBA</span>
                <span className="font-extrabold text-2xl text-orange-500 tracking-tight">COMIDA</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                Central de Operações Administrativas
              </span>
            </div>
          </div>

          <div className="mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma Enterprise v1.0</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Gestão inteligente do marketplace de delivery.
            </h1>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Monitore pedidos em tempo real, homologue novos restaurantes parceiros, controle
              catálogos de cardápio e audite transações financeiras em uma única plataforma unificada.
            </p>
          </div>

          {/* Operational Metrics Cards */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Store className="w-4 h-4 text-orange-400" />
                <span>Restaurantes Ativos</span>
              </div>
              <p className="text-2xl font-black text-white">{restaurantsCount || 48}</p>
              <span className="text-[10px] text-emerald-400 font-medium">● 100% Homologados</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Pedidos Operados</span>
              </div>
              <p className="text-2xl font-black text-white">{ordersCount || 1450}</p>
              <span className="text-[10px] text-orange-400 font-medium">● Fluxo em tempo real</span>
            </div>
          </div>

          {/* Core Modules List */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Controle de acesso granular baseado em papéis (RBAC)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Rastreabilidade completa de ações e auditoria em logs</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Personalização visual de lojas e domínios customizados</span>
            </div>
          </div>
        </div>

        {/* Security Badges Footer */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Criptografia TLS 1.3 / AES-256</span>
          </div>
          <span>LGPD Compliant</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form & Quick Access */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Header (visible only on small screens) */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 mb-3">
              <Flame className="w-8 h-8 fill-white text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              OBA <span className="text-orange-500">COMIDA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Painel de Gestão Administrativa</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
            {/* Header info inside card */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Acesso Administrativo</h2>
              <p className="text-xs text-slate-400 mt-1">
                Entre com seu e-mail corporativo para acessar o painel.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('form');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'form'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Credenciais
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('demo');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Perfis Demo</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start gap-3 text-rose-200 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-300">Falha na autenticação</p>
                  <p className="mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: Standard Credential Form */}
            {activeTab === 'form' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.nome@obacomida.com.br"
                      className="w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">Senha</label>
                    <button
                      type="button"
                      onClick={() => setIsRecoveryOpen(true)}
                      className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-slate-950 border-slate-700 rounded-sm focus:ring-orange-500/30"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400 cursor-pointer">
                    Manter-me conectado neste dispositivo
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Autenticando...</span>
                    </div>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Quick Demo Access Cards */}
            {activeTab === 'demo' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-400 mb-3">
                  Selecione um dos perfis pré-configurados para simular a visão operacional:
                </p>

                {/* Superadmin Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin')}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Carlos Albuquerque"
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300">
                          Carlos Albuquerque
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Superadmin
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Acesso irrestrito total a todas as áreas</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
                      alt="Mariana Duarte"
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-blue-300">
                          Mariana Duarte
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Administrador
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Gestão operacional, restaurantes e relatórios</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Operator Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('operator')}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                      alt="Camila Torres"
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-amber-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300">
                          Camila Torres
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Operador
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Despacho de pedidos, moderação e chamados</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Financial Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('financial')}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                      alt="Beatriz Fonseca"
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                          Beatriz Fonseca
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Financeiro
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Faturamento, conciliação e repasses</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}

            {/* Quick Demo Footer hint */}
            {activeTab === 'form' && (
              <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('demo')}
                  className="text-xs text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deseja testar sem digitar? Ver perfis de demonstração</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Copyright */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>© 2026 Oba Comida Marketplace Tecnologia Ltda.</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Ambiente de uso exclusivo e confidencial para colaboradores autorizados.
            </p>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <Modal
        isOpen={isRecoveryOpen}
        onClose={resetRecoveryModal}
        title="Recuperação de Senha"
        subtitle="Informe seu e-mail institucional para receber um link de redefinição seguro"
      >
        {recoverySent ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">E-mail de recuperação enviado!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Enviamos as orientações de redefinição de credenciais para <b>{recoveryEmail}</b>.
                Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <button
              type="button"
              onClick={resetRecoveryModal}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Entendido, voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={handleRecoverPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Administrativo
              </label>
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="seu.nome@obacomida.com.br"
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Um link com token de segurança será despachado para a conta informada.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetRecoveryModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isRecovering}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRecovering ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
