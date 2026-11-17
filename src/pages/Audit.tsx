import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import type { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(auditService.getAll());
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [logs, searchTerm, moduleFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trilha de Auditoria Administrativa
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {logs.length} registros imutáveis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rastreabilidade completa de todas as alterações críticas, intervenções operacionais e aprovações no sistema.
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
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação Executada</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Detalhes da Alteração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginated.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">{log.adminName}</td>

                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase">
                      {log.adminRole}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-orange-600">{log.module}</td>

                  <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.entityId}</td>

                  <td className="py-3 px-4 text-slate-600 max-w-md">
                    <p>{log.details}</p>
                    {(log.previousValue || log.currentValue) && (
                      <div className="mt-1 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 space-y-0.5 font-mono">
                        {log.previousValue && (
                          <div className="text-rose-600 truncate">
                            <span className="font-bold">Anterior:</span> {log.previousValue}
                          </div>
                        )}
                        {log.currentValue && (
                          <div className="text-emerald-700 truncate">
                            <span className="font-bold">Atual:</span> {log.currentValue}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
