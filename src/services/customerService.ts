import { db } from '../storage/db';
import type { Customer, AdminUser } from '../types';

export const customerService = {
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
