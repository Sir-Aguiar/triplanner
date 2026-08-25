import * as Network from 'expo-network';
import type { NetworkState } from 'expo-network';

/**
 * Interpreta o estado do `expo-network` (SDK 57).
 * `isInternetReachable` ausente/`undefined` = desconhecido → assume online e deixa o HTTP decidir.
 */
export function isNetworkStateOnline(state: NetworkState): boolean {
  if (state.isConnected === false) {
    return false;
  }
  if (state.isInternetReachable === false) {
    return false;
  }
  return true;
}

/**
 * Verifica se há conexão útil com a internet antes de ações API-first (ex.: clonar, mutação online).
 * Em falha da checagem, assume online e deixa o cliente HTTP reportar `ApiError.status === 0`.
 */
export async function isInternetReachable(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return isNetworkStateOnline(state);
  } catch {
    return true;
  }
}
