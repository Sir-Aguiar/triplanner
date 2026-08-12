import type { AuthUser } from '@/@types/Auth';
import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage-state';

export const SESSION_STORAGE_KEY = 'triplanner.session';
export const REFRESH_TOKEN_STORAGE_KEY = 'triplanner.refreshToken';
export const USER_STORAGE_KEY = 'triplanner.user';

export async function getStoredAccessToken(): Promise<string | null> {
  return getStorageItemAsync(SESSION_STORAGE_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return getStorageItemAsync(REFRESH_TOKEN_STORAGE_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getStorageItemAsync(USER_STORAGE_KEY);
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

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    setStorageItemAsync(SESSION_STORAGE_KEY, accessToken),
    setStorageItemAsync(REFRESH_TOKEN_STORAGE_KEY, refreshToken),
  ]);
}

export async function clearStoredAuth(): Promise<void> {
  await Promise.all([
    setStorageItemAsync(SESSION_STORAGE_KEY, null),
    setStorageItemAsync(REFRESH_TOKEN_STORAGE_KEY, null),
    setStorageItemAsync(USER_STORAGE_KEY, null),
  ]);
}
