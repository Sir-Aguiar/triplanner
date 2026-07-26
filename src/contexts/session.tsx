import { createContext, use, useState, type PropsWithChildren } from 'react';

import { useStorageState } from '@/hooks/use-storage-state';

const SESSION_STORAGE_KEY = 'triplanner.session';
/** Valor legado gravado como convidado — não conta como login. */
const LEGACY_GUEST_SESSION = 'guest';

type SessionContextValue = {
  /** Token/id de usuário autenticado; `null` se não estiver logado. */
  session: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  /** Modal de boas-vindas já foi dispensado nesta abertura do app. */
  hasDismissedWelcome: boolean;
  continueAsGuest: () => void;
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

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, rawSession], setSession] = useStorageState(SESSION_STORAGE_KEY);
  const [hasDismissedWelcome, setHasDismissedWelcome] = useState(false);

  const session = normalizeSession(rawSession);
  const isLoggedIn = session != null;

  return (
    <SessionContext.Provider
      value={{
        session,
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
        signOut: () => {
          setSession(null);
          setHasDismissedWelcome(false);
        },
      }}>
      {children}
    </SessionContext.Provider>
  );
}
