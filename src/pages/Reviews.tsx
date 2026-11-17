import React, { useState, useMemo } from 'react';
import {
  Star,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Eye,
  MessageSquare,
  Building2,
  Calendar,
} from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { restaurantService } from '../services/restaurantService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import type { Review } from '../types';

interface ReviewsProps {
  onViewOrder: (orderId: string) => void;
}

export const ReviewsPage: React.FC<ReviewsProps> = ({ onViewOrder }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [reviews, setReviews] = useState<Review[]>(reviewService.getAll());
  const restaurants = restaurantService.getAll();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [reportedFilter, setReportedFilter] = useState<string>('all');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Moderation Dialog
  const [targetReview, setTargetReview] = useState<Review | null>(null);
  const [moderationAction, setModerationAction] = useState<'approved' | 'hidden' | null>(null);
  const [justification, setJustification] = useState('');

  const refreshList = () => {
    setReviews(reviewService.getAll());
  };

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);
      const matchReported =
        reportedFilter === 'all' ||
        (reportedFilter === 'reported' ? r.reported : !r.reported);
      const matchRest = restaurantFilter === 'all' || r.restaurantId === restaurantFilter;

      return matchSearch && matchRating && matchReported && matchRest;
    });
  }, [reviews, searchTerm, ratingFilter, reportedFilter, restaurantFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleConfirmModeration = () => {
    if (!targetReview || !moderationAction) return;

    if (!justification.trim()) {
      error('É obrigatório registrar a justificativa administrativa.');
      return;
    }

    reviewService.moderate(
      targetReview.id,
      moderationAction,
      justification,
      currentUser
    );

    success(
      `Avaliação ${moderationAction === 'approved' ? 'aprovada' : 'ocultada'} com sucesso!`
    );

    setTargetReview(null);
    setModerationAction(null);
    setJustification('');
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Moderação de Avaliações
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {reviews.length} avaliações
            </span>
            {reviews.filter((r) => r.reported).length > 0 && (
              <Badge variant="danger" dot>
                {reviews.filter((r) => r.reported).length} denúncias pendentes
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento de feedbacks dos consumidores, análise de denúncias dos restaurantes e moderação de conteúdo.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por cliente, restaurante, código ou comentário..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
          >
            <option value="all">Todas as Notas (1 a 5 estrelas)</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Estrelas)</option>
            <option value="4">⭐⭐⭐⭐ (4 Estrelas)</option>
            <option value="3">⭐⭐⭐ (3 Estrelas)</option>
            <option value="2">⭐⭐ (2 Estrelas)</option>
            <option value="1">⭐ (1 Estrela)</option>
          </select>

          <select
            value={reportedFilter}
            onChange={(e) => {
              setReportedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
          >
            <option value="all">Denúncias: Todas</option>
            <option value="reported">Apenas Denunciadas</option>
            <option value="not_reported">Não Denunciadas</option>
          </select>

          <select
            value={restaurantFilter}
            onChange={(e) => {
              setRestaurantFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700 truncate"
          >
            <option value="all">Restaurantes: Todos</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-3">
        {paginated.map((rev) => (
          <div
            key={rev.id}
            className={`bg-white p-5 rounded-2xl border transition-all ${
              rev.reported
                ? 'border-rose-200 bg-rose-50/20 shadow-xs ring-1 ring-rose-200/50'
                : 'border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                  {rev.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                    <span className="text-slate-400 text-xs">avaliou</span>
                    <span className="font-bold text-xs text-orange-600">{rev.restaurantName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>Pedido #{rev.orderCode}</span>
                    <span>•</span>
                    <span>{new Date(rev.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Rating stars */}
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-800 ml-1">{rev.rating}.0</span>
                </div>

                <Badge
                  variant={
                    rev.moderationStatus === 'approved'
                      ? 'success'
                      : rev.moderationStatus === 'hidden'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {rev.moderationStatus === 'approved'
                    ? 'Aprovada'
                    : rev.moderationStatus === 'hidden'
                    ? 'Ocultada'
                    : 'Pendente'}
                </Badge>
              </div>
            </div>

            {/* Comment Body */}
            <p className="text-xs text-slate-700 bg-slate-50/60 p-3 rounded-xl border border-slate-100 my-2 italic">
              "{rev.comment}"
            </p>

            {/* Reported alert banner if present */}
            {rev.reported && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2 my-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Denúncia registrada pelo restaurante</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{rev.reportReason}</p>
                </div>
              </div>
            )}

            {/* Moderation justification note */}
            {rev.moderationJustification && (
              <p className="text-[11px] text-slate-500 bg-slate-100/70 p-2 rounded-lg mt-2">
                <strong>Justificativa da Moderação:</strong> {rev.moderationJustification} (por {rev.moderatedBy})
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-3 text-xs">
              <button
                onClick={() => onViewOrder(rev.orderId)}
                className="text-slate-500 hover:text-orange-600 font-semibold"
              >
                Ver Pedido {rev.orderCode} →
              </button>

              <div className="flex items-center gap-2">
                {rev.moderationStatus !== 'approved' && (
                  <button
                    onClick={() => {
                      setTargetReview(rev);
                      setModerationAction('approved');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aprovar Avaliação</span>
                  </button>
                )}

                {rev.moderationStatus !== 'hidden' && (
                  <button
                    onClick={() => {
                      setTargetReview(rev);
                      setModerationAction('hidden');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold border border-rose-200 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar Comentário</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Nenhuma avaliação encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(val) => {
          setItemsPerPage(val);
          setCurrentPage(1);
        }}
      />

      {/* Moderation Dialog */}
      <ConfirmDialog
        isOpen={!!targetReview && !!moderationAction}
        onClose={() => {
          setTargetReview(null);
          setModerationAction(null);
        }}
        onConfirm={handleConfirmModeration}
        title={
          moderationAction === 'approved'
            ? 'Aprovar Avaliação do Consumidor'
            : 'Ocultar Avaliação do Consumidor'
        }
        message={`Confirma a decisão de ${
          moderationAction === 'approved' ? 'manter visível' : 'ocultar do cardápio público'
        } a avaliação de ${targetReview?.customerName}?`}
        variant={moderationAction === 'hidden' ? 'danger' : 'primary'}
        requireReason
        reasonValue={justification}
        onReasonChange={setJustification}
        reasonPlaceholder="Informe a justificativa administrativa para a moderação desta avaliação..."
        confirmText="Confirmar Decisão"
      />
    </div>
  );
};
