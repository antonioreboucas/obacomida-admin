import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { AuditLog } from '../types';

export const auditService = {
  /**
   * GET /api/v1/admin/audit-logs?user_id=&action=&entity_name=&page=1&page_size=30
   * Rastreia todas as ações administrativas críticas com data, IP, usuário e alterações realizadas
   */
  async fetchAuditLogs(filters?: {
    user_id?: string;
    action?: string;
    entity_name?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: AuditLog[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.page_size || 30;

    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (filters?.user_id) params.user_id = filters.user_id;
      if (filters?.action) params.action = filters.action;
      if (filters?.entity_name) params.entity_name = filters.entity_name;

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
      console.warn('API de auditoria inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return { items: [], total: 0 };
    }

    const all = db.getAuditLogs();
    const filtered = all.filter((l) => {
      if (filters?.user_id && l.adminId !== filters.user_id && l.user_id !== filters.user_id) return false;
      if (filters?.action && !l.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
      if (filters?.entity_name && l.module !== filters.entity_name && l.entity_name !== filters.entity_name) return false;
      return true;
    });

    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
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
    return {
      id: String(item.id),
      adminId: item.admin_id || item.user_id || item.adminId || 'usr-system',
      adminName: item.admin_name || item.user_name || item.adminName || 'Administrador',
      adminRole: item.admin_role || item.user_role || item.adminRole || 'ADMIN',
      action: item.action || 'Operação administrativa',
      module: item.module || item.entity_name || 'Geral',
      entity_name: item.entity_name || item.module,
      entityId: item.entity_id || item.entityId || 'N/A',
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      ip_address: item.ip_address || item.ip || '127.0.0.1',
      details: item.details || item.description || '',
      changes: item.changes || (item.previousValue && item.currentValue ? { before: item.previousValue, after: item.currentValue } : undefined),
      previousValue: typeof item.previous_value === 'object' ? JSON.stringify(item.previous_value) : item.previous_value || item.previousValue,
      currentValue: typeof item.current_value === 'object' ? JSON.stringify(item.current_value) : item.current_value || item.currentValue,
    };
  },
};
