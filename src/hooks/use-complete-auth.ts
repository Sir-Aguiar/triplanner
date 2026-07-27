import { router } from 'expo-router';

import type { AuthTokensResponse } from '@/@types/Auth';
import { useSession } from '@/contexts/session';

/**
 * Persiste tokens + usuário da API e navega para a área autenticada do app.
 */
export function useCompleteAuth() {
  const { signIn } = useSession();

  return (auth: AuthTokensResponse) => {
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
