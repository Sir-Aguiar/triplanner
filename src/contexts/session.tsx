import { createContext, use, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { router } from 'expo-router';

import type { AuthUser } from '@/@types/Auth';
import { setAuthSessionListeners } from '@/api/auth-session';
import {
  REFRESH_TOKEN_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '@/api/token-storage';
import { useStorageState } from '@/hooks/use-storage-state';

/** Valor legado gravado como convidado — não conta como login. */
const LEGACY_GUEST_SESSION = 'guest';

type SignInParams = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type SessionContextValue = {
  /** Access token do usuário autenticado; `null` se não estiver logado. */
  session: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  /** Modal de boas-vindas já foi dispensado nesta abertura do app. */
  hasDismissedWelcome: boolean;
  continueAsGuest: () => void;
  signIn: (params: SignInParams) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

function normalizeSession(raw: string | null): string | null {
  if (raw == null || raw === LEGACY_GUEST_SESSION) {
    return null;
  }
  return raw;
}

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (
      typeof parsed?.userId === 'string' &&
      typeof parsed?.username === 'string' &&
      typeof parsed?.name === 'string' &&
      typeof parsed?.email === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isSessionLoading, rawSession], setSession] = useStorageState(SESSION_STORAGE_KEY);
  const [[isRefreshLoading], setRefreshToken] = useStorageState(REFRESH_TOKEN_STORAGE_KEY);
  const [[isUserLoading, rawUser], setUserRaw] = useStorageState(USER_STORAGE_KEY);
  const [hasDismissedWelcome, setHasDismissedWelcome] = useState(false);

  const session = normalizeSession(rawSession);
  const user = useMemo(() => parseStoredUser(rawUser), [rawUser]);
  const isLoggedIn = session != null;
  const isLoading = isSessionLoading || isRefreshLoading || isUserLoading;

  useEffect(() => {
    setAuthSessionListeners({
      onTokensUpdated: ({ accessToken, refreshToken }) => {
        setSession(accessToken);
        setRefreshToken(refreshToken);
      },
      onAuthFailed: () => {
        setSession(null);
        setRefreshToken(null);
        setUserRaw(null);
        setHasDismissedWelcome(false);
        setTimeout(() => {
          router.replace('/entrar');
        }, 0);
      },
    });

    return () => setAuthSessionListeners(null);
  }, [setSession, setRefreshToken, setUserRaw]);

  return (
    <SessionContext.Provider
      value={{
        session,
        user: isLoggedIn ? user : null,
        isLoggedIn,
        isLoading,
        hasDismissedWelcome,
        continueAsGuest: () => {
          // Convidado não persiste login — só dispensa o modal nesta abertura.
          if (rawSession === LEGACY_GUEST_SESSION) {
            setSession(null);
          }
          setHasDismissedWelcome(true);
        },
        signIn: ({ accessToken, refreshToken, user: nextUser }) => {
          setSession(accessToken);
          setRefreshToken(refreshToken);
          setUserRaw(JSON.stringify(nextUser));
          setHasDismissedWelcome(true);
        },
        signOut: () => {
          setSession(null);
          setRefreshToken(null);
          setUserRaw(null);
          setHasDismissedWelcome(false);
        },
      }}>
      {children}
    </SessionContext.Provider>
  );
}
