import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Upload,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { Category } from '../types';

export const CategoriesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Create / Edit modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Utensils',
    image: '',
    icon_url: '',
    displayOrder: 1,
    active: true,
    description: '',
  });

  // Delete Confirm Dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.fetchGlobal();
      setCategories(data);
    } catch (err) {
      console.warn('Erro ao carregar categorias:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: 'Utensils',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      icon_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      displayOrder: categories.length + 1,
      active: true,
      description: '',
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      image: cat.icon_url || cat.image,
      icon_url: cat.icon_url || cat.image,
      displayOrder: cat.sort_order ?? cat.displayOrder,
      active: cat.is_active ?? cat.active,
      description: cat.description || '',
    });
    setIsOpenModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await categoryService.uploadMedia(file, 'banners');
      setFormData((prev) => ({
        ...prev,
        image: url,
        icon_url: url,
      }));
      success('Arquivo enviado com sucesso!');
    } catch (err: any) {
      error('Falha no upload do arquivo:', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('O nome da categoria é obrigatório.');
      return;
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      await categoryService.updateApi(
        editingCategory.id,
        {
          name: formData.name,
          slug,
          description: formData.description,
          icon_url: formData.icon_url || formData.image,
          sort_order: formData.displayOrder,
          is_active: formData.active,
        },
        currentUser
      );
      success(`Categoria "${formData.name}" atualizada com sucesso!`);
    } else {
      await categoryService.createApi(
        {
          name: formData.name,
          slug,
          description: formData.description,
          icon_url: formData.icon_url || formData.image,
          sort_order: formData.displayOrder,
          is_active: formData.active,
        },
        currentUser
      );
      success(`Categoria "${formData.name}" criada com sucesso!`);
    }

    setIsOpenModal(false);
    refreshList();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await categoryService.deleteApi(deleteTarget.id, currentUser);
    success(`Categoria "${deleteTarget.name}" excluída.`);
    setDeleteTarget(null);
    refreshList();
  };

  const handleToggleActive = async (cat: Category) => {
    const nextState = !(cat.is_active ?? cat.active);
    await categoryService.updateApi(cat.id, { is_active: nextState, active: nextState }, currentUser);
    success(`Categoria "${cat.name}" ${nextState ? 'ativada' : 'desativada'}.`);
    refreshList();
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    categoryService.reorder(reordered, currentUser);
    refreshList();
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...categories];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    setDraggedIndex(null);
    categoryService.reorder(reordered, currentUser);
    refreshList();
    info('Ordem atualizada via arrastar e soltar');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Categorias Globais do Marketplace
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {categories.length} categorias
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize a hierarquia do catálogo, banners, ícones e ordem de exibição na home do consumidor. Arraste os cards para reordenar.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Categoria Global</span>
        </button>
      </div>

      {/* Grid of Categories with Drag-and-Drop Reordering */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
          <p className="text-xs font-semibold">Carregando categorias globais (/categories/global)...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => (
            <div
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-move group ${
              (cat.is_active ?? cat.active)
                ? 'border-slate-200 hover:border-orange-300 hover:shadow-md'
                : 'border-slate-200 opacity-60 bg-slate-50/50'
            } ${draggedIndex === index ? 'opacity-40 border-dashed border-orange-500' : ''}`}
          >
            <div>
              {/* Category banner image */}
              <div className="h-32 w-full relative bg-slate-100 overflow-hidden">
                <img
                  src={cat.icon_url || cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-slate-400" />
                    #{cat.sort_order ?? cat.displayOrder}
                  </span>
                  <Badge variant={(cat.is_active ?? cat.active) ? 'success' : 'neutral'} size="sm">
                    {(cat.is_active ?? cat.active) ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>

              {/* Category Details */}
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    /{cat.slug}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {cat.description || 'Categoria de produtos e gastronomia Oba Comida'}
                </p>
                <div className="pt-2 text-[10px] text-slate-400 font-semibold">
                  {cat.productsCount} produtos cadastrados
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveOrder(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 transition-colors"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrder(index, 'down')}
                  disabled={index === categories.length - 1}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 transition-colors"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  title={(cat.is_active ?? cat.active) ? 'Desativar categoria' : 'Ativar categoria'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    (cat.is_active ?? cat.active)
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {(cat.is_active ?? cat.active) ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(cat)}
                  title="Editar categoria"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  title="Excluir categoria"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal Create/Edit with File Upload to /api/v1/uploads */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingCategory ? 'Editar Categoria Global' : 'Cadastrar Categoria Global'}
        subtitle="Defina o nome, ícone/banner, ordem de exibição e visibilidade no marketplace"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Hamburguerias Artesanais"
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Identificador (Slug)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="Ex: hamburguerias-artesanais"
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Image & File Upload Integration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ícone ou Banner da Categoria *
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value, icon_url: e.target.value })}
                  placeholder="URL da imagem (ex: https://...)"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {formData.image && (
                <div className="h-24 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-50">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] bg-slate-900/80 text-white px-1.5 py-0.5 rounded font-mono">
                    Pré-visualização
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ordem de Exibição (sort_order)
              </label>
              <input
                type="number"
                min={1}
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visibilidade (is_active)
              </label>
              <select
                value={formData.active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="true">Ativa (Visível na home)</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Burgers smash artesanais e acompanhamentos..."
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Categoria Global"
        message={`Deseja realmente excluir a categoria "${deleteTarget?.name}"? Esta ação removerá a categoria do marketplace.`}
        variant="danger"
        confirmText="Excluir Categoria"
      />
    </div>
  );
};
