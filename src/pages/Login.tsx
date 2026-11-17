import React, { useState } from 'react';
import { Flame, Lock, Mail, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';
import type { AdminRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, availableStaff } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('carlos.super@obacomida.com.br');
  const [password, setPassword] = useState('admin123');
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

          {/* Quick Demo Impersonation section */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Acesso Rápido por Perfil (Demo)
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 text-left transition-colors group"
              >
                <p className="text-[11px] font-bold text-purple-300 group-hover:text-purple-200">
                  Superadmin
                </p>
                <p className="text-[10px] text-slate-400 truncate">Carlos Albuquerque</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40 text-left transition-colors group"
              >
                <p className="text-[11px] font-bold text-blue-300 group-hover:text-blue-200">
                  Administrador
                </p>
                <p className="text-[10px] text-slate-400 truncate">Mariana Duarte</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-colors group"
              >
                <p className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200">
                  Operador
                </p>
                <p className="text-[10px] text-slate-400 truncate">Camila Torres</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('financial')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-colors group"
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
