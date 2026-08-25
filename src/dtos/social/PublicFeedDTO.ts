/** Autor de um item do feed público (GET /social/feed). */
export type PublicFeedAuthorDto = {
  userId: string;
  username: string;
  name: string;
};

/** Item retornado pelo feed público. Datas vêm como ISO string no JSON. */
export type PublicFeedItemDto = {
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
};

export type GetPublicFeedResponseDto = {
  items: PublicFeedItemDto[];
  nextCursor: string | null;
};

/** Query params de GET /social/feed */
export type GetPublicFeedQuery = {
  limit?: number;
  cursor?: string;
  minBudget?: number;
  maxBudget?: number;
  minDurationDays?: number;
  maxDurationDays?: number;
  categoryIds?: string[];
};
