import { db } from '../storage/db';
import type { PlatformSettings, AdminUser } from '../types';

export const settingsService = {
  get(): PlatformSettings {
    return db.getSettings();
  },

  update(updates: Partial<PlatformSettings>, admin: AdminUser): PlatformSettings {
    const current = db.getSettings();
    const updated = { ...current, ...updates };

    db.saveSettings(updated);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Atualização de configurações globais da plataforma',
      module: 'Configurações',
      entityId: 'global_settings',
      details: 'Parâmetros operacionais e taxas padrão foram alterados',
      previousValue: JSON.stringify(current),
      currentValue: JSON.stringify(updated),
    });

    return updated;
  },

  resetDefaults(admin: AdminUser): void {
    db.resetToDefaults();
    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Restauração de dados de fábrica',
      module: 'Configurações',
      entityId: 'database',
      details: 'Base mockada restaurada aos padrões originais de demonstração',
    });
  },
};
