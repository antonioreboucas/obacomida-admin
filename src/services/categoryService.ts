import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Category, AdminUser } from '../types';

export const categoryService = {
  /**
   * GET /api/v1/categories/global
   * Lista todas as categorias globais do marketplace
   */
  async fetchGlobal(): Promise<Category[]> {
    try {
      const data = await api.get<any>('/categories/global');
      const list = Array.isArray(data) ? data : (data?.items || data?.data);
      if (Array.isArray(list)) {
        const mapped = list.map((item, index) => this.normalizeFromApi(item, index));
        // Keep in sync with local storage
        if (mapped.length > 0) {
          db.saveCategories(mapped);
        }
        return mapped.sort((a, b) => (a.sort_order ?? a.displayOrder) - (b.sort_order ?? b.displayOrder));
      }
      if (!isMockEnabled()) {
        return [];
      }
    } catch (err) {
      if (!isMockEnabled()) {
        console.warn('Erro ao carregar categorias globais da API:', err);
        return [];
      }
    }

    return this.getAll();
  },

  getAll(): Category[] {
    return db.getCategories().sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getById(id: string): Category | undefined {
    return db.getCategories().find((c) => c.id === id);
  },

  /**
   * POST /api/v1/categories/global
   * Cadastra nova categoria global no marketplace
   */
  async createApi(
    data: {
      name: string;
      slug: string;
      description?: string;
      icon_url?: string;
      sort_order?: number;
      is_active?: boolean;
    },
    admin: AdminUser
  ): Promise<Category> {
    const sort_order = data.sort_order ?? db.getCategories().length + 1;
    const is_active = data.is_active ?? true;

    let createdId = `cat-${Date.now()}`;

    try {
      const res = await api.post<any>('/categories/global', {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        icon_url: data.icon_url || '',
        sort_order,
        is_active,
      });

      if (res?.id) {
        createdId = String(res.id);
      }
    } catch (err) {
      console.warn('Erro ao salvar categoria via API, aplicando fallback local:', err);
    }

    const newCategory: Category = {
      id: createdId,
      name: data.name,
      slug: data.slug,
      icon: 'Utensils',
      icon_url: data.icon_url,
      image: data.icon_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      displayOrder: sort_order,
      sort_order,
      active: is_active,
      is_active,
      productsCount: 0,
      description: data.description,
    };

    const categories = db.getCategories();
    db.saveCategories([...categories, newCategory]);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Criação de categoria global (API)',
      module: 'Categorias',
      entityId: newCategory.id,
      details: `Categoria global "${newCategory.name}" cadastrada`,
      currentValue: JSON.stringify(newCategory),
    });

    return newCategory;
  },

  /**
   * PUT /api/v1/categories/{id}
   * Atualiza categoria global existente
   */
  async updateApi(
    id: string,
    updates: Partial<Category>,
    admin: AdminUser
  ): Promise<Category | undefined> {
    try {
      await api.put(`/categories/${id}`, {
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        icon_url: updates.icon_url || updates.image,
        sort_order: updates.sort_order ?? updates.displayOrder,
        is_active: updates.is_active ?? updates.active,
      });
    } catch (err) {
      console.warn('Erro ao atualizar categoria via API, aplicando fallback local:', err);
    }

    return this.update(id, updates, admin);
  },

  /**
   * DELETE /api/v1/categories/{id}
   * Exclui categoria global
   */
  async deleteApi(id: string, admin: AdminUser): Promise<boolean> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (err) {
      console.warn('Erro ao excluir categoria via API, aplicando fallback local:', err);
    }

    return this.delete(id, admin);
  },

  /**
   * POST /api/v1/uploads
   * FormData: file, entity_type: "banners" | "icons"
   */
  async uploadMedia(file: File, entityType = 'banners'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);

      const res = await api.upload<any>('/uploads', formData);
      const fileUrl = res?.url || res?.file_url || res?.path;
      if (fileUrl) return fileUrl;
    } catch (err) {
      console.warn('Erro no upload via API, gerando URL temporária para preview:', err);
    }

    // Fallback preview URL
    return URL.createObjectURL(file);
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
      adminRole: String(admin.role),
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
    const updated: Category = {
      ...category,
      ...updates,
      sort_order: updates.sort_order ?? updates.displayOrder ?? category.displayOrder,
      displayOrder: updates.sort_order ?? updates.displayOrder ?? category.displayOrder,
      active: updates.is_active ?? updates.active ?? category.active,
      is_active: updates.is_active ?? updates.active ?? category.active,
    };

    db.saveCategories(categories.map((c) => (c.id === id ? updated : c)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
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
      adminRole: String(admin.role),
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
      sort_order: index + 1,
    }));
    db.saveCategories(updated);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Reordenação de categorias',
      module: 'Categorias',
      entityId: 'global',
      details: 'Ordem de exibição das categorias foi atualizada',
    });
  },

  normalizeFromApi(item: any, fallbackIndex: number): Category {
    const order = Number(item.sort_order ?? item.display_order ?? item.displayOrder ?? fallbackIndex + 1);
    const active = item.is_active ?? item.active ?? true;
    const img = item.icon_url || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

    return {
      id: String(item.id),
      name: item.name || 'Categoria',
      slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'categoria'),
      icon: item.icon || 'Utensils',
      icon_url: item.icon_url,
      image: img,
      displayOrder: order,
      sort_order: order,
      active,
      is_active: active,
      productsCount: Number(item.products_count ?? item.productsCount ?? 0),
      description: item.description,
    };
  },
};
