import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { AuditLog } from '../types';
import type { AuditLogItem, AuditLogsQueryParams } from '../types/api';

export const auditService = {
  /**
   * GET /api/v1/admin/audit-logs?action=&entity_name=&entity_id=&page=&per_page=
   * Trilha de auditoria oficial com data, IP, usuário, user_agent e diff de valores
   */
  async fetchAuditLogs(
    filters?: AuditLogsQueryParams & { user_id?: string; page_size?: number }
  ): Promise<{ items: AuditLog[]; total: number }> {
    const page = filters?.page || 1;
    const perPage = filters?.per_page || filters?.page_size || 30;

    try {
      const params: Record<string, any> = { page, per_page: perPage };
      if (filters?.action) params.action = filters.action;
      if (filters?.entity_name) params.entity_name = filters.entity_name;
      if (filters?.entity_id) params.entity_id = filters.entity_id;
      if (filters?.user_id) params.user_id = filters.user_id;

      const data = await api.get<any>('/admin/audit-logs', params);

      if (Array.isArray(data)) {
        return {
          items: data.map((item) => this.normalizeFromApi(item)),
          total: data.length,
        };
      } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: any) => this.normalizeFromApi(item)),
          total: data.total || data.count || data.items.length,
        };
      }
    } catch (err) {
      console.warn('API /admin/audit-logs inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return { items: [], total: 0 };
    }

    const all = db.getAuditLogs();
    const filtered = all.filter((l) => {
      if (filters?.user_id && l.adminId !== filters.user_id && l.user_id !== filters.user_id) return false;
      if (filters?.action && !l.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
      if (filters?.entity_name && l.module !== filters.entity_name && l.entity_name !== filters.entity_name) return false;
      if (filters?.entity_id && l.entityId !== filters.entity_id) return false;
      return true;
    });

    const start = (page - 1) * perPage;
    return {
      items: filtered.slice(start, start + perPage),
      total: filtered.length,
    };
  },

  getAll(): AuditLog[] {
    return db.getAuditLogs();
  },

  getByModule(moduleName: string): AuditLog[] {
    return db.getAuditLogs().filter((log) => log.module === moduleName);
  },

  getByEntity(entityId: string): AuditLog[] {
    return db.getAuditLogs().filter((log) => log.entityId === entityId);
  },

  clearHistory(): void {
    db.resetToDefaults();
  },

  normalizeFromApi(item: any): AuditLog {
    const userEmail = item.user_email || item.admin_email || item.email || 'sistema@obacomida.com.br';
    const oldVals = item.old_values !== undefined ? item.old_values : item.previous_value || item.previousValue;
    const newVals = item.new_values !== undefined ? item.new_values : item.current_value || item.currentValue;

    return {
      id: String(item.id),
      adminId: item.admin_id || item.user_id || item.adminId || 'usr-system',
      adminName: item.admin_name || item.user_name || item.user_email || 'Administrador',
      adminRole: item.admin_role || item.user_role || item.adminRole || 'ADMIN',
      action: item.action || 'Operação administrativa',
      module: item.module || item.entity_name || 'Geral',
      entity_name: item.entity_name || item.module,
      entityId: item.entity_id || item.entityId || 'N/A',
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      ip_address: item.ip_address || item.ip || '127.0.0.1',
      details: item.details || item.description || (userEmail ? `Ação por ${userEmail}` : ''),
      changes:
        item.changes ||
        (oldVals && newVals
          ? { before: oldVals, after: newVals }
          : undefined),
      previousValue: typeof oldVals === 'object' ? JSON.stringify(oldVals) : String(oldVals || ''),
      currentValue: typeof newVals === 'object' ? JSON.stringify(newVals) : String(newVals || ''),
    };
  },
};

export default auditService;
