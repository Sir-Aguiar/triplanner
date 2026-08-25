import type { PublicFeedAuthorDto } from '@/dtos/social/PublicFeedDTO';

/** Categoria embutida em uma atividade do detalhe público. */
export type PublicTripCategoryDto = {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
};

/** Atividade retornada por GET /social/trips/:tripId. Datas em ISO string. */
export type PublicTripActivityDto = {
  activityId: string;
  categoryId: string;
  category: PublicTripCategoryDto;
  title: string;
  notes: string;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
};

/** Detalhe de viagem pública (GET /social/trips/:tripId). */
export type PublicTripDto = {
  tripId: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  coverImage: string;
  totalBudget: number;
  activityCount: number;
  categoryIds: string[];
  author: PublicFeedAuthorDto;
  createdAt: string;
  activities: PublicTripActivityDto[];
};
