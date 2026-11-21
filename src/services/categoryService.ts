import { db } from '../storage/db';
import { api, isMockEnabled } from './api';
import type { Category, AdminUser } from '../types';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types/api';
import { uploadService } from './uploadService';

export const categoryService = {
  /**
   * GET /api/v1/categories
   * Lista todas as categorias globais públicas do marketplace
   */
  async fetchCategories(): Promise<Category[]> {
    try {
      let data: any = null;
      try {
        data = await api.get<any>('/categories');
      } catch (catErr: any) {
        if (catErr?.status === 404 || catErr?.status === 403) {
          data = await api.get<any>('/categories/global');
        } else {
          throw catErr;
        }
      }

      const rawList = Array.isArray(data) ? data : (data?.items || data?.data);
      const list = Array.isArray(rawList) ? rawList : (rawList?.items || []);
      if (Array.isArray(list)) {
        const mapped = list.map((item, index) => this.normalizeFromApi(item, index));
        db.saveCategories(mapped);
        return mapped.sort((a, b) => (a.sort_order ?? a.displayOrder) - (b.sort_order ?? b.displayOrder));
      }
    } catch (err) {
      console.warn('API de categorias inacessível ou sem permissão:', err);
    }

    if (!isMockEnabled()) {
      return [];
    }

    return this.getAll();
  },

  // Backwards compatible alias
  async fetchGlobal(): Promise<Category[]> {
    return this.fetchCategories();
  },

  getAll(): Category[] {
    return db.getCategories().sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getById(id: string): Category | undefined {
    return db.getCategories().find((c) => c.id === id);
  },

  /**
   * POST /api/v1/admin/categories
   * Cadastra nova categoria global no marketplace
   * Body: { name, slug?, description?, image_url?, is_active: true, display_order: 0 }
   */
  async createApi(
    data: CreateCategoryRequest & { icon_url?: string; sort_order?: number },
    admin: AdminUser
  ): Promise<Category> {
    const displayOrder = data.display_order ?? data.sort_order ?? db.getCategories().length + 1;
    const isActive = data.is_active ?? true;
    const imageUrl = data.image_url || data.icon_url || '';

    let createdId = `cat-${Date.now()}`;

    try {
      let res: any = null;
      try {
        res = await api.post<any>('/admin/categories', {
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          image_url: imageUrl,
          is_active: isActive,
          display_order: displayOrder,
        });
      } catch (errAdmin: any) {
        if (errAdmin?.status === 404) {
          res = await api.post<any>('/categories/global', {
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            icon_url: imageUrl,
            sort_order: displayOrder,
            is_active: isActive,
          });
        } else {
          throw errAdmin;
        }
      }

      if (res?.id) {
        createdId = String(res.id);
      }
    } catch (err) {
      console.warn('Erro ao salvar categoria via API, aplicando fallback local:', err);
    }

    const newCategory: Category = {
      id: createdId,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      icon: 'Utensils',
      icon_url: imageUrl,
      image: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      displayOrder: displayOrder,
      sort_order: displayOrder,
      active: isActive,
      is_active: isActive,
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
   * PUT /api/v1/admin/categories/{category_id}
   * Atualiza dados, ordem de exibição e imagem da categoria
   */
  async updateApi(
    id: string,
    updates: Partial<Category>,
    admin: AdminUser
  ): Promise<Category | undefined> {
    try {
      const payload: UpdateCategoryRequest = {
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        image_url: updates.image || updates.icon_url,
        is_active: updates.is_active ?? updates.active,
        display_order: updates.sort_order ?? updates.displayOrder,
      };

      try {
        await api.put(`/admin/categories/${id}`, payload);
      } catch (errAdmin: any) {
        if (errAdmin?.status === 404) {
          await api.put(`/categories/${id}`, {
            ...payload,
            icon_url: payload.image_url,
            sort_order: payload.display_order,
          });
        } else {
          throw errAdmin;
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar categoria via API, aplicando fallback local:', err);
    }

    return this.update(id, updates, admin);
  },

  /**
   * DELETE /api/v1/admin/categories/{category_id}
   * Remoção lógica ou definitiva da categoria global
   */
  async deleteApi(id: string, admin: AdminUser): Promise<boolean> {
    try {
      try {
        await api.delete(`/admin/categories/${id}`);
      } catch (errAdmin: any) {
        if (errAdmin?.status === 404) {
          await api.delete(`/categories/${id}`);
        } else {
          throw errAdmin;
        }
      }
    } catch (err) {
      console.warn('Erro ao excluir categoria via API, aplicando fallback local:', err);
    }

    return this.delete(id, admin);
  },

  /**
   * Upload de imagem para categoria via POST /uploads/image?category=categories
   */
  async uploadMedia(file: File, _entityType?: string): Promise<string> {
    try {
      const res = await uploadService.uploadImage(file, 'categories');
      return res.url;
    } catch (err) {
      console.warn('Erro no upload via API, gerando preview local:', err);
      return URL.createObjectURL(file);
    }
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
      action: 'Edição de categoria',
      module: 'Categorias',
      entityId: id,
      details: `Categoria "${category.name}" atualizada`,
      previousValue: JSON.stringify(previous),
      currentValue: JSON.stringify(updated),
    });

    return updated;
  },

  toggleActive(id: string, admin: AdminUser): Category | undefined {
    const category = this.getById(id);
    if (!category) return undefined;
    const newActive = !category.active;
    return this.update(id, { active: newActive, is_active: newActive }, admin);
  },

  reorder(orderedIdsOrCats: (string | Category)[], admin: AdminUser): Category[] {
    const orderedIds = orderedIdsOrCats.map((item) => (typeof item === 'string' ? item : item.id));
    const categories = db.getCategories();
    const updated = categories.map((c) => {
      const newOrder = orderedIds.indexOf(c.id);
      return newOrder !== -1
        ? { ...c, displayOrder: newOrder + 1, sort_order: newOrder + 1 }
        : c;
    });

    const sorted = updated.sort((a, b) => a.displayOrder - b.displayOrder);
    db.saveCategories(sorted);

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: String(admin.role),
      action: 'Reordenação de categorias',
      module: 'Categorias',
      entityId: 'multiple',
      details: 'Ordem de exibição das categorias foi atualizada',
    });

    return sorted;
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
      details: `Categoria "${category.name}" excluída`,
    });

    return true;
  },

  normalizeFromApi(item: any, fallbackIndex = 0): Category {
    const sortOrder = Number(
      item.sort_order ?? item.display_order ?? item.displayOrder ?? fallbackIndex + 1
    );
    const isActive = Boolean(
      item.is_active !== undefined ? item.is_active : item.active !== undefined ? item.active : true
    );
    const img =
      item.icon_url ||
      item.image_url ||
      item.image ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

    return {
      id: String(item.id),
      name: item.name || 'Categoria',
      slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'cat'),
      icon: item.icon || 'Utensils',
      icon_url: item.icon_url || item.image_url,
      image: img,
      displayOrder: sortOrder,
      sort_order: sortOrder,
      active: isActive,
      is_active: isActive,
      productsCount: Number(item.products_count ?? item.productsCount ?? 0),
      description: item.description || '',
    };
  },
};

export default categoryService;
