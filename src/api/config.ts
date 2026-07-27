import { Platform } from "react-native";

/**
 * Base URL da API remota.
 *
 * No emulador Android, `localhost` é o próprio emulador — use `10.0.2.2`
 * para alcançar a máquina host (onde o servidor roda).
 *
 * Defina `EXPO_PUBLIC_API_URL` no `.env` para sobrescrever
 * (ex.: IP da máquina em dispositivo físico).
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }

  return "http://localhost:8080";
}

