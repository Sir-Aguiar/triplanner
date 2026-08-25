import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { GetPublicFeedQuery, GetPublicFeedResponseDto } from '@/dtos';
import { ServiceError, toServiceError } from '@/services/errors';

function buildFeedParams(query: GetPublicFeedQuery = {}): Record<string, string | number> {
  const params: Record<string, string | number> = {
    limit: query.limit ?? 20,
  };

  if (query.cursor) {
    params.cursor = query.cursor;
  }
  if (query.minBudget != null) {
    params.minBudget = query.minBudget;
  }
  if (query.maxBudget != null) {
    params.maxBudget = query.maxBudget;
  }
  if (query.minDurationDays != null) {
    params.minDurationDays = query.minDurationDays;
  }
  if (query.maxDurationDays != null) {
    params.maxDurationDays = query.maxDurationDays;
  }
  if (query.categoryIds && query.categoryIds.length > 0) {
    params.categoryIds = query.categoryIds.join(',');
  }

  return params;
}

export class SocialService {
  /** GET /social/feed — viagens públicas de outros usuários (requer Bearer token). */
  async getFeed(
    accessToken: string,
    query: GetPublicFeedQuery = {},
  ): Promise<GetPublicFeedResponseDto> {
    try {
      return await apiRequest<GetPublicFeedResponseDto>('/social/feed', {
        method: 'GET',
        accessToken,
        params: buildFeedParams(query),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new ServiceError('Faça login para ver o feed da comunidade.', error);
        }
        throw new ServiceError(error.message || 'Não foi possível carregar o feed.', error);
      }

      throw toServiceError(error, 'Não foi possível carregar o feed');
    }
  }
}

export const socialService = new SocialService();
