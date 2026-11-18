import React, { useState } from 'react';
import { Flame, Lock, Mail, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';
import type { AdminRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, availableStaff, isApiConnected, apiBaseUrl } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('admin1@obacomida.com.br');
  const [password, setPassword] = useState('Admin@123456');
  const [isLoading, setIsLoading] = useState(false);

  // Recovery modal
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      success('Login realizado com sucesso!', 'Bem-vindo ao Oba Comida Admin.');
    } else {
      error('Falha no login', res.error || 'Credenciais inválidas');
    }
  };

  const handleQuickLogin = async (role: AdminRole) => {
    const user = availableStaff.find((u) => u.role === role && u.status === 'Ativo');
    if (user) {
      setEmail(user.email);
      setPassword('admin123');
      setIsLoading(true);
      const res = await login(user.email, 'admin123');
      setIsLoading(false);
      if (res.success) {
        success(`Autenticado como ${user.name}`, `Perfil: ${role.toUpperCase()}`);
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
      info('Instruções enviadas', res.message);
      setIsRecoveryOpen(false);
      setRecoveryEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30">
            <Flame className="w-8 h-8 fill-white text-white" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          OBA <span className="text-orange-500">COMIDA</span>
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Painel de Gestão Administrativa
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 text-slate-200">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                E-mail Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@obacomida.com.br"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">Senha</label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Acessando central...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* API Target Status Bar */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isApiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-400 truncate">
                API: <span className="font-mono text-slate-200">{apiBaseUrl}</span>
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                isApiConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isApiConnected ? 'Online' : 'Aguardando Servidor'}
            </span>
          </div>

          {/* Quick Demo Impersonation section */}
          <div className="mt-5 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Credenciais Oficiais de Teste (API Seed)
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={async () => {
                  setEmail('admin1@obacomida.com.br');
                  setPassword('Admin@123456');
                  setIsLoading(true);
                  const res = await login('admin1@obacomida.com.br', 'Admin@123456');
                  setIsLoading(false);
                  if (res.success) {
                    success('Autenticado com sucesso!', 'Perfil: ADMIN');
                  } else {
                    error('Falha no login', res.error || 'Credenciais inválidas');
                  }
                }}
                className="p-2.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-950/60 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                    ADMIN
                  </p>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                    Oficial
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">admin1@obacomida.com.br</p>
                <p className="text-[9px] text-slate-500 font-mono">Admin@123456</p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail('superadmin@obacomida.com.br');
                  setPassword('Admin@123456');
                  setIsLoading(true);
                  const res = await login('superadmin@obacomida.com.br', 'Admin@123456');
                  setIsLoading(false);
                  if (res.success) {
                    success('Autenticado com sucesso!', 'Perfil: SUPER_ADMIN');
                  } else {
                    error('Falha no login', res.error || 'Credenciais inválidas');
                  }
                }}
                className="p-2.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-950/60 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">
                    SUPER_ADMIN
                  </p>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                    Oficial
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">superadmin@obacomida.com.br</p>
                <p className="text-[9px] text-slate-500 font-mono">Admin@123456</p>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 text-center">
              Perfis de Demonstração Local
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="p-2 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-colors group"
              >
                <p className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200">
                  Operador
                </p>
                <p className="text-[10px] text-slate-400 truncate">Camila Torres</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('financial')}
                className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-colors group"
              >
                <p className="text-[11px] font-bold text-emerald-300 group-hover:text-emerald-200">
                  Financeiro
                </p>
                <p className="text-[10px] text-slate-400 truncate">Beatriz Fonseca</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <Modal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        title="Recuperar Senha Administrativa"
        subtitle="Informe o seu e-mail funcional para receber as instruções de redefinição"
      >
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
              placeholder="seu.email@obacomida.com.br"
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecoveryOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRecovering}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              {isRecovering ? 'Enviando...' : 'Enviar Instruções'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
