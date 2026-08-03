export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthSessionListeners = {
  onTokensUpdated: (tokens: AuthTokenPair) => void;
  onAuthFailed: () => void;
};

let listeners: AuthSessionListeners | null = null;

export function setAuthSessionListeners(next: AuthSessionListeners | null): void {
  listeners = next;
}

export function notifyTokensUpdated(tokens: AuthTokenPair): void {
  listeners?.onTokensUpdated(tokens);
}

export function notifyAuthFailed(): void {
  listeners?.onAuthFailed();
}
