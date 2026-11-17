import { db } from '../storage/db';
import type { Category, AdminUser } from '../types';

export const categoryService = {
  getAll(): Category[] {
    return db.getCategories().sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getById(id: string): Category | undefined {
    return db.getCategories().find((c) => c.id === id);
  },

  create(data: Omit<Category, 'id' | 'productsCount'>, admin: AdminUser): Category {
    const categories = db.getCategories();
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      productsCount: 0,
    };

    db.saveCategories([...categories, newCategory]);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Criação de categoria',
      module: 'Categorias',
      entityId: newCategory.id,
      details: `Nova categoria criada: "${newCategory.name}" (ordem: ${newCategory.displayOrder})`,
      currentValue: JSON.stringify(newCategory),
    });

    return newCategory;
  },

  update(id: string, updates: Partial<Category>, admin: AdminUser): Category | undefined {
    const categories = db.getCategories();
    const category = categories.find((c) => c.id === id);
    if (!category) return undefined;

    const previous = { ...category };
    const updated = { ...category, ...updates };

    db.saveCategories(categories.map((c) => (c.id === id ? updated : c)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Atualização de categoria',
      module: 'Categorias',
      entityId: id,
      details: `Categoria "${category.name}" atualizada`,
      previousValue: JSON.stringify({ name: previous.name, order: previous.displayOrder, active: previous.active }),
      currentValue: JSON.stringify({ name: updated.name, order: updated.displayOrder, active: updated.active }),
    });

    return updated;
  },

  delete(id: string, admin: AdminUser): boolean {
    const categories = db.getCategories();
    const category = categories.find((c) => c.id === id);
    if (!category) return false;

    db.saveCategories(categories.filter((c) => c.id !== id));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Exclusão de categoria',
      module: 'Categorias',
      entityId: id,
      details: `Categoria "${category.name}" foi excluída do sistema`,
      previousValue: JSON.stringify(category),
    });

    return true;
  },

  reorder(categoriesOrdered: Category[], admin: AdminUser): void {
    const updated = categoriesOrdered.map((cat, index) => ({
      ...cat,
      displayOrder: index + 1,
    }));
    db.saveCategories(updated);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Reordenação de categorias',
      module: 'Categorias',
      entityId: 'global',
      details: 'Ordem de exibição das categorias foi atualizada',
    });
  },
};
