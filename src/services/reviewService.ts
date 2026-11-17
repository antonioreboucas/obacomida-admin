import { db } from '../storage/db';
import type { Review, AdminUser } from '../types';

export const reviewService = {
  getAll(): Review[] {
    return db.getReviews();
  },

  getById(id: string): Review | undefined {
    return db.getReviews().find((r) => r.id === id);
  },

  getByRestaurantId(restaurantId: string): Review[] {
    return db.getReviews().filter((r) => r.restaurantId === restaurantId);
  },

  moderate(
    id: string,
    action: 'approved' | 'hidden',
    justification: string,
    admin: AdminUser
  ): Review | undefined {
    const reviews = db.getReviews();
    const review = reviews.find((r) => r.id === id);
    if (!review) return undefined;

    const updated: Review = {
      ...review,
      moderationStatus: action,
      moderationJustification: justification,
      moderatedBy: admin.name,
      moderatedAt: new Date().toISOString(),
    };

    db.saveReviews(reviews.map((r) => (r.id === id ? updated : r)));

    db.logAudit({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Moderação de avaliação de consumidor',
      module: 'Avaliações',
      entityId: review.id,
      details: `Avaliação do cliente "${review.customerName}" para o restaurante "${review.restaurantName}" moderada para "${action}". Justificativa: ${justification}`,
      previousValue: review.moderationStatus,
      currentValue: action,
    });

    return updated;
  },
};
