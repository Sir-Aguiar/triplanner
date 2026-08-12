import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useToast } from '@/components/ui/toast';
import { useSession } from '@/contexts/session';
import { syncService, tripService } from '@/services';

const OFFLINE_TOAST = 'Você continuará em modo offline.';

type Credentials = {
  accessToken: string;
  userId: string;
};

/**
 * Sincroniza ao abrir (com loading) e ao fechar/ir para background (silencioso).
 * Mutações (editar/excluir) disparam sync imediato via SyncService.scheduleSyncAfterMutation.
 * Rede indisponível na abertura → toast (RN03).
 */
export function useBackgroundSync() {
  const { isLoggedIn, isLoading, session, user } = useSession();
  const { showToast } = useToast();
  const [isOpenSyncInProgress, setIsOpenSyncInProgress] = useState(false);
  const [hasCompletedOpenSync, setHasCompletedOpenSync] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const credentialsRef = useRef<Credentials | null>(null);
  const openSyncGenerationRef = useRef(0);

  const isAuthenticated = Boolean(isLoggedIn && session && user?.userId && !isLoading);

  useEffect(() => {
    if (isLoggedIn && session && user?.userId) {
      credentialsRef.current = { accessToken: session, userId: user.userId };
      return;
    }

    credentialsRef.current = null;
    openSyncGenerationRef.current += 1;
    setIsOpenSyncInProgress(false);
    setHasCompletedOpenSync(false);
  }, [isLoggedIn, session, user?.userId]);

  const runOpenSync = useCallback(async () => {
    const creds = credentialsRef.current;
    if (!creds) {
      return;
    }

    const generation = ++openSyncGenerationRef.current;
    setIsOpenSyncInProgress(true);

    try {
      try {
        await tripService.claimOrphanTrips(creds.userId);
      } catch (error) {
        console.error('Falha ao vincular viagens órfãs antes do sync:', error);
        return;
      }

      const result = await syncService.syncNow(creds.accessToken, creds.userId);
      if (result === 'offline' || result === 'error') {
        showToast(OFFLINE_TOAST);
      }
    } finally {
      if (generation === openSyncGenerationRef.current) {
        setIsOpenSyncInProgress(false);
        setHasCompletedOpenSync(true);
      }
    }
  }, [showToast]);

  const runCloseSync = useCallback(() => {
    const creds = credentialsRef.current;
    if (!creds) {
      return;
    }

    void (async () => {
      try {
        await tripService.claimOrphanTrips(creds.userId);
      } catch (error) {
        console.error('Falha ao vincular viagens órfãs antes do sync de fechamento:', error);
        return;
      }

      await syncService.syncNow(creds.accessToken, creds.userId);
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void runOpenSync();
  }, [isAuthenticated, runOpenSync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState === 'background' && nextState === 'active') {
        void runOpenSync();
        return;
      }

      if (nextState === 'background') {
        runCloseSync();
      }
    });

    return () => subscription.remove();
  }, [runCloseSync, runOpenSync]);

  const isSyncingOnOpen = isAuthenticated && (!hasCompletedOpenSync || isOpenSyncInProgress);

  return { isSyncingOnOpen };
}
