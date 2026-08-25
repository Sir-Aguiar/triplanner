import Constants from "expo-constants";
import { isDevice } from "expo-device";
import { Platform } from "react-native";

/**
 * Base URL da API remota.
 *
 * No emulador Android, `localhost` é o próprio emulador — use `10.0.2.2`
 * para alcançar a máquina host (onde o servidor roda).
 *
 * Em dispositivo físico, `10.0.2.2` / `localhost` são reescritos para o IP
 * da máquina na LAN (o mesmo host do Metro).
 *
 * Defina `EXPO_PUBLIC_API_URL` no `.env` para sobrescrever
 * (ex.: IP da máquina ou URL de produção).
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);

function getDevMachineHost(): string | null {
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const match = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}

let hasLoggedBaseUrl = false;

function resolveForPhysicalDevice(url: string): string {
  if (!isDevice) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
      return url;
    }

    const host = getDevMachineHost();
    if (!host) {
      return url;
    }

    parsed.hostname = host;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const fallback = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
  const resolved = resolveForPhysicalDevice((configured || fallback).replace(/\/$/, ""));

  if (__DEV__ && !hasLoggedBaseUrl) {
    hasLoggedBaseUrl = true;
    console.log("[api] base URL:", resolved);
  }

  return resolved;
}
