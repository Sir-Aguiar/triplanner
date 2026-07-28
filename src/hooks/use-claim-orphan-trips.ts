import { useEffect, useRef } from 'react';

import { useSession } from '@/contexts/session';
import { tripService } from '@/services';

/**
 * Na restauração de sessão (app já logado), vincula viagens órfãs ao usuário.
 * O claim no login novo já acontece em `useCompleteAuth`; este hook cobre o cold start.
 */
export function useClaimOrphanTripsOnSession() {
  const { isLoggedIn, isLoading, user } = useSession();
  const claimedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !isLoggedIn || !user?.userId) {
      return;
    }

    if (claimedForUserRef.current === user.userId) {
      return;
    }

    claimedForUserRef.current = user.userId;

    void tripService.claimOrphanTrips(user.userId).catch((error) => {
      console.error('Falha ao vincular viagens órfãs na restauração de sessão:', error);
      // Permite nova tentativa se falhar (ex.: DB ainda ocupado).
      claimedForUserRef.current = null;
    });
  }, [isLoading, isLoggedIn, user?.userId]);
}
