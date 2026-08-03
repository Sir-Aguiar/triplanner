import * as Network from 'expo-network';

/**
 * Verifica se há conexão útil com a internet antes de ações API-first (ex.: clonar).
 * Em falha da checagem, assume online e deixa o cliente HTTP reportar `ApiError.status === 0`.
 */
export async function isInternetReachable(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) {
      return false;
    }
    if (state.isInternetReachable === false) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
