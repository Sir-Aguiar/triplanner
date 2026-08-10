import { getApiBaseUrl } from '@/api/config';

/** Placeholder do sync JSON quando ainda não há capa na nuvem. */
export const COVER_IMAGE_PLACEHOLDER = 'placeholder';

/** Caminho físico permanente no aparelho (ainda não enviado à nuvem). */
export function isLocalCoverUri(coverImage: string | null | undefined): boolean {
  const value = (coverImage ?? '').trim();
  return value.startsWith('file:') || value.startsWith('content:');
}

/** URL remota absoluta (http/https). */
export function isRemoteCoverUri(coverImage: string | null | undefined): boolean {
  const value = (coverImage ?? '').trim();
  return value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Capa persistida no servidor (URL absoluta ou caminho relativo tipo `/static/...`).
 * Não inclui `file://` nem o placeholder.
 */
export function isServerCoverValue(coverImage: string | null | undefined): boolean {
  const value = (coverImage ?? '').trim();
  if (!value || value === COVER_IMAGE_PLACEHOLDER || isLocalCoverUri(value)) {
    return false;
  }
  return true;
}

/**
 * No Android (emulador/dispositivo), `localhost`/`127.0.0.1` não alcançam o PC.
 * Reescreve o host loopback para a mesma origem de `getApiBaseUrl()` (ex.: 10.0.2.2).
 */
function rewriteLoopbackToApiHost(absoluteUrl: string): string {
  try {
    const parsed = new URL(absoluteUrl);
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return absoluteUrl;
    }

    const apiBase = new URL(getApiBaseUrl());
    parsed.protocol = apiBase.protocol;
    parsed.hostname = apiBase.hostname;
    parsed.port = apiBase.port;
    return parsed.toString();
  } catch {
    return absoluteUrl;
  }
}

/**
 * Converte o valor de `coverImage` do banco em URI utilizável pelo `expo-image`.
 * - `file://...` → como está
 * - `http(s)://localhost/...` → reescreve para a base da API do app
 * - `/static/...` → prefixa com a base da API
 */
export function resolveCoverImageUri(coverImage: string | null | undefined): string | null {
  const value = (coverImage ?? '').trim();
  if (!value || value === COVER_IMAGE_PLACEHOLDER) {
    return null;
  }

  if (isLocalCoverUri(value)) {
    return value;
  }

  if (isRemoteCoverUri(value)) {
    return rewriteLoopbackToApiHost(value);
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  if (value.startsWith('/')) {
    return `${base}${value}`;
  }

  return `${base}/${value}`;
}

/** URI que o componente de imagem consegue renderizar (local ou remota). */
export function isRenderableCoverUri(coverImage: string | null | undefined): boolean {
  return resolveCoverImageUri(coverImage) != null;
}

/**
 * Valor seguro para o payload JSON de sync: nunca envia `file://` ao servidor.
 */
export function coverImageForSyncPayload(coverImage: string | null | undefined): string {
  const value = (coverImage ?? '').trim();
  if (!value || isLocalCoverUri(value)) {
    return COVER_IMAGE_PLACEHOLDER;
  }

  return value;
}
