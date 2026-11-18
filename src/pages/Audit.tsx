import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import type { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Selected Log for JSON Diff Inspection (Checklist Item 6)
  const [selectedDiffLog, setSelectedDiffLog] = useState<AuditLog | null>(null);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditService.fetchAuditLogs({
        action: searchTerm || undefined,
        entity_name: moduleFilter !== 'all' ? moduleFilter : undefined,
        page: currentPage,
        page_size: itemsPerPage,
      });
      setLogs(res.items);
      setTotalLogs(res.total);
    } catch (err) {
      console.warn('Erro ao buscar logs de auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, moduleFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  const modules = [
    'Restaurantes',
    'Pedidos',
    'Financeiro',
    'Categorias',
    'Produtos',
    'Promoções',
    'Usuários',
    'Configurações',
    'Autenticação',
  ];

  // Helper to format JSON safely
  const formatJson = (val?: string) => {
    if (!val) return null;
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trilha de Auditoria Administrativa & Segurança
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-mono">
              GET /api/v1/admin/audit-logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade imutável de todas as ações administrativas críticas, alteração de comissões, intervenções em pedidos e IP de origem.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por operador, ação executada, detalhes ou código de entidade..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
        >
          <option value="all">Todos os Módulos</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">IP Origem</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação Executada</th>
                <th className="py-3 px-4">Entidade ID</th>
                <th className="py-3 px-4 text-right">JSON Diff / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {log.ip_address || '127.0.0.1'}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">{log.adminName}</td>

                  <td className="py-3 px-4">
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                      {log.adminRole}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-orange-600">{log.module}</td>

                  <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                    {log.entityId}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(log.previousValue || log.currentValue || log.changes) ? (
                        <button
                          onClick={() => setSelectedDiffLog(log)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                          title="Inspecionar JSON Diff das alterações"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Ver Diff</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {log.details}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalLogs}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* JSON Diff Viewer Modal (Checklist Item 6) */}
      <Modal
        isOpen={!!selectedDiffLog}
        onClose={() => setSelectedDiffLog(null)}
        title="Histórico de Auditoria: JSON Diff das Alterações"
        subtitle={`Registro #${selectedDiffLog?.id} • Ação: ${selectedDiffLog?.action}`}
        maxWidth="4xl"
      >
        {selectedDiffLog && (
          <div className="space-y-4">
            {/* Metadata Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">OPERADOR</span>
                <span className="font-bold text-slate-900">{selectedDiffLog.adminName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">PERFIL</span>
                <span className="font-mono text-purple-700 font-bold uppercase">{selectedDiffLog.adminRole}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">IP DE ORIGEM</span>
                <span className="font-mono text-slate-700">{selectedDiffLog.ip_address || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">DATA / HORA</span>
                <span className="font-mono text-slate-700">{new Date(selectedDiffLog.timestamp).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-white p-2 border border-slate-200 rounded-xl">
              <strong>Descrição da Ação:</strong> {selectedDiffLog.details}
            </div>

            {/* Side-by-Side JSON Diff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before / Anterior */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                  <span>Estado Anterior (Before)</span>
                  <span className="text-[10px] font-mono">old_value</span>
                </div>
                <pre className="p-3 bg-slate-950 text-rose-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800">
                  {formatJson(selectedDiffLog.previousValue) || '// Nenhum estado anterior registrado (registro inicial)'}
                </pre>
              </div>

              {/* After / Atual */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span>Estado Novo (After)</span>
                  <span className="text-[10px] font-mono">new_value</span>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800">
                  {formatJson(selectedDiffLog.currentValue) || '// Nenhum valor novo registrado'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDiffLog(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
              >
                Fechar Visualizador de Diff
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
