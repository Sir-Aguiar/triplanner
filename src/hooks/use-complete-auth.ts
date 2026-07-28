import { router } from 'expo-router';

import type { AuthTokensResponse } from '@/@types/Auth';
import { useSession } from '@/contexts/session';
import { tripService } from '@/services';

/**
 * Persiste tokens + usuário da API, vincula viagens órfãs locais e navega
 * para a área autenticada do app.
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

    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace('/(tabs)');
  };
}
