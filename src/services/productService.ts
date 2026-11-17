import { db } from '../storage/db';
import type { Product, ProductStatus, AdminUser } from '../types';

export const productService = {
  getAll(): Product[] {
    return db.getProducts();
  },

  getById(id: string): Product | undefined {
    return db.getProducts().find((p) => p.id === id);
  },

  getByRestaurantId(restaurantId: string): Product[] {
    return db.getProducts().filter((p) => p.restaurantId === restaurantId);
  },

  moderate(
    id: string,
    newStatus: ProductStatus,
    justification: string,
    admin: AdminUser
  ): Product | undefined {
    const products = db.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) return undefined;

    const historyEntry = {
      date: new Date().toISOString(),
      action: `Status alterado de "${product.status}" para "${newStatus}"`,
      justification,
      adminName: admin.name,
    };

    const updated: Product = {
      ...product,
      status: newStatus,
      moderationHistory: [historyEntry, ...product.moderationHistory],
    };

    db.saveProducts(products.map((p) => (p.id === id ? updated : p)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Moderação de produto do cardápio',
      module: 'Produtos',
      entityId: product.id,
      details: `Produto "${product.name}" do estabelecimento "${product.restaurantName}" moderado para "${newStatus}". Justificativa: ${justification}`,
      previousValue: product.status,
      currentValue: newStatus,
    });

    return updated;
  },

  toggleAvailability(id: string, admin: AdminUser, reason?: string): Product | undefined {
    const products = db.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) return undefined;

    const newAvailability = !product.available;
    const historyEntry = {
      date: new Date().toISOString(),
      action: `Disponibilidade alterada para ${newAvailability ? 'Disponível' : 'Indisponível'}`,
      justification: reason || 'Ajuste manual pela moderação',
      adminName: admin.name,
    };

    const updated: Product = {
      ...product,
      available: newAvailability,
      moderationHistory: [historyEntry, ...product.moderationHistory],
    };

    db.saveProducts(products.map((p) => (p.id === id ? updated : p)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Alteração de disponibilidade de produto',
      module: 'Produtos',
      entityId: product.id,
      details: `Produto "${product.name}" definido como ${newAvailability ? 'Disponível' : 'Indisponível'}.`,
    });

    return updated;
  },
};
