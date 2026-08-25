import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/contexts/session';
import type { PublicFeedItemDto } from '@/dtos';
import { ServiceError, socialService } from '@/services';
import { isInternetReachable } from '@/utils/network';

const OFFLINE_FEED_MESSAGE = 'Conecte-se à internet para ver o feed da comunidade.';
const LOGIN_FEED_MESSAGE = 'Faça login para explorar roteiros da comunidade.';
const DEFAULT_LIMIT = 20;

export type UseSocialFeedResult = {
  items: PublicFeedItemDto[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  isLoggedIn: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

/**
 * Feed social (GET /social/feed) com pull-to-refresh e paginação por cursor.
 * Requer usuário autenticado e rede.
 */
export function useSocialFeed(limit = DEFAULT_LIMIT): UseSocialFeedResult {
  const { session, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [items, setItems] = useState<PublicFeedItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const fetchGeneration = useRef(0);
  const sessionRef = useRef(session);
  const isLoggedInRef = useRef(isLoggedIn);
  const limitRef = useRef(limit);

  sessionRef.current = session;
  isLoggedInRef.current = isLoggedIn;
  limitRef.current = limit;
  nextCursorRef.current = nextCursor;

  const fetchPage = useCallback(async (mode: 'initial' | 'refresh' | 'more') => {
    if (!isLoggedInRef.current || !sessionRef.current) {
      setItems([]);
      setNextCursor(null);
      setError(LOGIN_FEED_MESSAGE);
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    const online = await isInternetReachable();
    if (!online) {
      if (mode === 'initial' || mode === 'refresh') {
        setError(OFFLINE_FEED_MESSAGE);
        if (mode === 'initial') {
          setItems([]);
          setNextCursor(null);
        }
      }
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    if (mode === 'more') {
      if (!nextCursorRef.current || loadingMoreRef.current) {
        return;
      }
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const generation = ++fetchGeneration.current;
    const cursor = mode === 'more' ? nextCursorRef.current : undefined;

    try {
      const response = await socialService.getFeed(sessionRef.current, {
        limit: limitRef.current,
        cursor: cursor ?? undefined,
      });

      if (generation !== fetchGeneration.current) {
        return;
      }

      setError(null);
      setNextCursor(response.nextCursor);
      setItems((prev) => (mode === 'more' ? [...prev, ...response.items] : response.items));
    } catch (err) {
      if (generation !== fetchGeneration.current) {
        return;
      }

      const message =
        err instanceof ServiceError && err.message
          ? err.message
          : 'Não foi possível carregar o feed.';

      setError(message);
      if (mode === 'initial') {
        setItems([]);
        setNextCursor(null);
      }
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    void fetchPage('initial');
  }, [sessionLoading, isLoggedIn, session, fetchPage]);

  const refresh = useCallback(async () => {
    await fetchPage('refresh');
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    await fetchPage('more');
  }, [fetchPage]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: nextCursor != null,
    isLoggedIn,
    refresh,
    loadMore,
  };
}
