import { router } from 'expo-router';

import type { AuthTokensResponse } from '@/@types/Auth';
import { useSession } from '@/contexts/session';
import { tripService } from '@/services';

/**
 * Persiste tokens + usuário da API, vincula viagens órfãs e vai para o Home.
 * O `setTimeout` espera o gatekeeper remontar a AppStack (quando vinha do AuthGate)
 * antes do replace para `/(tabs)`. O sync fica a cargo de `useBackgroundSync`.
 */
export function useCompleteAuth() {
  const { signIn } = useSession();

  return async (auth: AuthTokensResponse) => {
    await tripService.claimOrphanTrips(auth.user.userId);

    signIn({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    });

    setTimeout(() => {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(tabs)');
    }, 0);
  };
}
