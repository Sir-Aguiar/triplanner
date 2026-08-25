import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/contexts/session';
import type { PublicTripDto } from '@/dtos';
import { ServiceError, socialService } from '@/services';
import { isInternetReachable } from '@/utils/network';

const OFFLINE_MESSAGE = 'Conecte-se à internet para ver este roteiro.';
const LOGIN_MESSAGE = 'Faça login para ver este roteiro da comunidade.';

export type UsePublicTripResult = {
  trip: PublicTripDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/** Carrega detalhe de viagem pública (GET /social/trips/:tripId). */
export function usePublicTrip(tripId: string | undefined): UsePublicTripResult {
  const { session, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [trip, setTrip] = useState<PublicTripDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId) {
      setTrip(null);
      setError('Roteiro inválido.');
      setLoading(false);
      return;
    }

    if (!isLoggedIn || !session) {
      setTrip(null);
      setError(LOGIN_MESSAGE);
      setLoading(false);
      return;
    }

    const online = await isInternetReachable();
    if (!online) {
      setError(OFFLINE_MESSAGE);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await socialService.getTrip(session, tripId);
      setTrip(result);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ServiceError && err.message
          ? err.message
          : 'Não foi possível carregar o roteiro.';
      setError(message);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, session, tripId]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    void load();
  }, [load, sessionLoading]);

  return {
    trip,
    loading: loading || sessionLoading,
    error,
    refresh: load,
  };
}
