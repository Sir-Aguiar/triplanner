import { useEffect, useRef } from 'react';

import { useToast } from '@/components/ui/toast';
import { useSession } from '@/contexts/session';
import { syncService, tripService } from '@/services';

const OFFLINE_TOAST = 'Você continuará em modo offline.';

/**
 * Quando a sessão autenticada fica disponível (cold start ou pós-login):
 * claim de órfãs + sync em background (RN02). Rede indisponível → toast (RN03).
 */
export function useBackgroundSync() {
  const { isLoggedIn, isLoading, session, user } = useSession();
  const { showToast } = useToast();
  const syncedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoggedIn || !session || !user?.userId) {
      syncedForUserRef.current = null;
      return;
    }

    if (syncedForUserRef.current === user.userId) {
      return;
    }

    syncedForUserRef.current = user.userId;
    const userId = user.userId;
    const accessToken = session;

    void (async () => {
      try {
        await tripService.claimOrphanTrips(userId);
      } catch (error) {
        console.error('Falha ao vincular viagens órfãs antes do sync:', error);
        syncedForUserRef.current = null;
        return;
      }

      const result = await syncService.syncNow(accessToken, userId);
      if (result === 'offline' || result === 'error') {
        showToast(OFFLINE_TOAST);
      }
    })();
  }, [isLoading, isLoggedIn, session, user?.userId, showToast]);
}
