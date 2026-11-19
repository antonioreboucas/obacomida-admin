import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Customer, AdminUser } from '../types';

export const customerService = {
  /**
   * GET /api/v1/admin/users?role=CUSTOMER
   * Lista clientes da plataforma
   */
  async fetchCustomers(search = '', page = 1, pageSize = 50): Promise<Customer[]> {
    try {
      const data = await api.get<any>('/admin/users', {
        role: 'CUSTOMER',
        search: search || undefined,
        page,
        page_size: pageSize,
      });

      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any) => ({
          id: String(item.id),
          name: item.name || item.full_name || 'Cliente',
          email: item.email || '',
          phone: item.phone || '(11) 99999-0000',
          createdAt: item.created_at || new Date().toISOString(),
          status: item.is_active === false || item.is_blocked === true ? 'Inativo' : 'Ativo',
          totalOrders: Number(item.total_orders ?? 0),
          totalSpent: Number(item.total_spent ?? 0),
          addresses: Array.isArray(item.addresses) ? item.addresses : [],
          avatar: item.avatar || item.avatar_url,
        }));
      }
    } catch (err) {
      console.warn('API de clientes vazia ou inacessível, utilizando clientes iniciais:', err);
    }

    return this.getAll();
  },

  getAll(): Customer[] {
    return db.getCustomers();
  },

  getById(id: string): Customer | undefined {
    return db.getCustomers().find((c) => c.id === id);
  },

  update(id: string, updates: Partial<Customer>, admin: AdminUser): Customer | undefined {
    const customers = db.getCustomers();
    const target = customers.find((c) => c.id === id);
    if (!target) return undefined;

    const previous = { ...target };
    const updated: Customer = { ...target, ...updates };
    db.saveCustomers(customers.map((c) => (c.id === id ? updated : c)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Atualização de dados de cliente',
      module: 'Clientes',
      entityId: id,
      details: `Cliente ${target.name} atualizado.`,
      previousValue: JSON.stringify({ name: previous.name, status: previous.status, phone: previous.phone }),
      currentValue: JSON.stringify({ name: updated.name, status: updated.status, phone: updated.phone }),
    });

    return updated;
  },

  toggleStatus(id: string, admin: AdminUser): Customer | undefined {
    const customer = this.getById(id);
    if (!customer) return undefined;
    const newStatus = customer.status === 'Ativo' ? 'Inativo' : 'Ativo';
    return this.update(id, { status: newStatus }, admin);
  },
};
