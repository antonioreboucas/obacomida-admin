import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { PlatformSettings, AdminUser } from '../types';
import type { PlatformSettingsData, PlatformSettingsUpdate } from '../types/api';

export const settingsService = {
  /**
   * GET /api/v1/admin/settings
   * Retorna as configurações corporativas globais
   */
  async fetchSettings(): Promise<PlatformSettings> {
    const token = api.getToken();
    if (token) {
      try {
        const data = await api.get<any>('/admin/settings');
        const payload = data?.data || data;
        if (payload && (payload.platform_name || payload.company_name || payload.cnpj)) {
          const mapped: PlatformSettings = {
            platformName: payload.platform_name || 'Oba Comida',
            companyName: payload.company_name || 'Oba Comida Marketplace Ltda.',
            cnpj: payload.cnpj || '38.921.842/0001-90',
            supportEmail: payload.support_email || 'suporte@obacomida.com.br',
            supportPhone: payload.support_phone || '(11) 4002-8922',
            logoUrl: payload.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
            primaryColor: payload.primary_color || '#ff6600',
            secondaryColor: payload.secondary_color || '#ff8833',
            defaultCommissionRate: Number(payload.default_commission_rate ?? 12.0),
            defaultFixedFee: Number(payload.default_fixed_fee ?? 1.5),
            defaultServiceFeeRate: Number(payload.default_service_fee_rate ?? 3.0),
            minOrderValueDefault: Number(payload.min_order_value_default ?? 20.0),
            allowedPaymentMethods: payload.allowed_payment_methods || ['Cartão de Crédito', 'Pix', 'Dinheiro'],
            maintenanceMode: Boolean(payload.maintenance_mode),
            autoApproveNewRestaurants: Boolean(payload.auto_approve_new_restaurants),
            supportOperatingHours: payload.support_operating_hours || 'Seg a Dom, 08h às 23h',
            appDomain: payload.app_domain || 'app-obacomida.vercel.app',
            appProtocol: payload.app_protocol || 'https',
            appPathPattern: payload.app_path_pattern || '/{slug}',
            partnerDomain: payload.partner_domain || 'obacomida-partner.vercel.app',
            partnerProtocol: payload.partner_protocol || 'https',
            partnerPathPattern: payload.partner_path_pattern || '/{slug}',
          };

          db.saveSettings(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('API /admin/settings inacessível, utilizando cache/mock local:', err);
      }
    }

    return this.get();
  },

  get(): PlatformSettings {
    return db.getSettings();
  },

  /**
   * PUT /api/v1/admin/settings
   * Body: PlatformSettingsUpdate
   */
  async updateApi(
    updates: Partial<PlatformSettings>,
    admin: AdminUser
  ): Promise<PlatformSettings> {
    const token = api.getToken();
    if (token) {
      try {
        const payload: PlatformSettingsUpdate = {
          platform_name: updates.platformName,
          company_name: updates.companyName,
          cnpj: updates.cnpj,
          support_email: updates.supportEmail,
          support_phone: updates.supportPhone,
          support_operating_hours: updates.supportOperatingHours,
          logo_url: updates.logoUrl,
          primary_color: updates.primaryColor,
          secondary_color: updates.secondaryColor,
          default_commission_rate: updates.defaultCommissionRate != null ? Number(updates.defaultCommissionRate) : undefined,
          default_fixed_fee: updates.defaultFixedFee != null ? Number(updates.defaultFixedFee) : undefined,
          default_service_fee_rate: updates.defaultServiceFeeRate != null ? Number(updates.defaultServiceFeeRate) : undefined,
          min_order_value_default: updates.minOrderValueDefault != null ? Number(updates.minOrderValueDefault) : undefined,
          maintenance_mode: updates.maintenanceMode,
          auto_approve_new_restaurants: updates.autoApproveNewRestaurants,
          app_domain: updates.appDomain,
          app_protocol: updates.appProtocol,
          app_path_pattern: updates.appPathPattern,
          partner_domain: updates.partnerDomain,
          partner_protocol: updates.partnerProtocol,
          partner_path_pattern: updates.partnerPathPattern,
        };

        await api.put('/admin/settings', payload);
      } catch (err) {
        console.warn('Erro ao atualizar configurações via PUT /admin/settings, aplicando fallback local:', err);
      }
    } else {
      console.info('Configurações salvas localmente (sessão administrativa sem token ativo na API remota).');
    }

    return this.update(updates, admin);
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

export default settingsService;
