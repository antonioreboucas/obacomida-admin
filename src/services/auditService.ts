import { db } from '../storage/db';
import type { AuditLog } from '../types';

export const auditService = {
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
    // Reset to defaults or clear
    db.resetToDefaults();
  },
};
