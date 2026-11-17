import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Image,
  Utensils,
  Tag,
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
  const { success, error } = useToast();

  const [categories, setCategories] = useState<Category[]>(categoryService.getAll());

  // Create / Edit modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Utensils',
    image: '',
    displayOrder: 1,
    active: true,
    description: '',
  });

  // Delete Confirm Dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const refreshList = () => {
    setCategories(categoryService.getAll());
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: 'Utensils',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
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
      image: cat.image,
      displayOrder: cat.displayOrder,
      active: cat.active,
      description: cat.description || '',
    });
    setIsOpenModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('O nome da categoria é obrigatório.');
      return;
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      categoryService.update(
        editingCategory.id,
        { ...formData, slug },
        currentUser
      );
      success(`Categoria "${formData.name}" atualizada com sucesso!`);
    } else {
      categoryService.create(
        { ...formData, slug },
        currentUser
      );
      success(`Categoria "${formData.name}" criada com sucesso!`);
    }

    setIsOpenModal(false);
    refreshList();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    categoryService.delete(deleteTarget.id, currentUser);
    success(`Categoria "${deleteTarget.name}" excluída.`);
    setDeleteTarget(null);
    refreshList();
  };

  const handleToggleActive = (cat: Category) => {
    categoryService.update(cat.id, { active: !cat.active }, currentUser);
    success(`Categoria "${cat.name}" ${!cat.active ? 'ativada' : 'desativada'}.`);
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
            Organize a hierarquia do catálogo, banners, ícones e ordem de exibição no aplicativo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 ${
              cat.active ? 'border-slate-200 hover:border-orange-300' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              {/* Category banner image */}
              <div className="h-28 w-full relative bg-slate-100 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    #{cat.displayOrder}
                  </span>
                  <Badge variant={cat.active ? 'success' : 'neutral'} size="sm">
                    {cat.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>

              {/* Category Details */}
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {cat.description || 'Categoria de cardápio do Oba Comida'}
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
                  onClick={() => moveOrder(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-20 transition-colors"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
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
                  onClick={() => handleToggleActive(cat)}
                  title={cat.active ? 'Desativar categoria' : 'Ativar categoria'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cat.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {cat.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleOpenEdit(cat)}
                  title="Editar categoria"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
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

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}
        subtitle="Defina o nome, ícone, imagem e ordenação da categoria"
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
              URL da Imagem / Banner *
            </label>
            <input
              type="url"
              required
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ordem de Exibição
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
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
              placeholder="Ex: Burgers smash artesanais e batatas rústicas..."
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
        title="Excluir Categoria"
        message={`Deseja realmente excluir a categoria "${deleteTarget?.name}"? Esta ação não afetará os produtos já vinculados.`}
        variant="danger"
        confirmText="Excluir Categoria"
      />
    </div>
  );
};
