import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { RefreshTokensResponse } from '@/@types/Auth';
import { notifyAuthFailed, notifyTokensUpdated } from '@/api/auth-session';
import { getApiBaseUrl } from '@/api/config';
import { ApiError, toApiError } from '@/api/errors';
import { getStoredRefreshToken, setStoredTokens } from '@/api/token-storage';

export type ApiAuthRequestConfig = {
  /** Evita loop ao chamar /auth/refresh pelo próprio cliente. */
  _skipAuthRefresh?: boolean;
  _retry?: boolean;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & ApiAuthRequestConfig;

export type ApiRequestOptions = Omit<AxiosRequestConfig, 'url' | 'data'> & {
  body?: unknown;
  accessToken?: string | null;
};

export const api = axios.create({
  headers: {
    Accept: 'application/json',
  },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      notifyAuthFailed();
      throw new ApiError('Sessão expirada. Faça login novamente.', 401);
    }

    try {
      const { data } = await axios.post<RefreshTokensResponse>(
        `${getApiBaseUrl()}/auth/refresh`,
        { refreshToken },
        {
          headers: { Accept: 'application/json' },
          timeout: 30_000,
        },
      );

      await setStoredTokens(data.accessToken, data.refreshToken);
      notifyTokensUpdated({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      return data.accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          notifyAuthFailed();
        }
        throw toApiError(status, error.response.data, 'Não foi possível renovar a sessão.');
      }

      if (axios.isAxiosError(error) && error.request) {
        throw new ApiError('Não foi possível conectar ao servidor.', 0, error.message);
      }

      throw new ApiError('Não foi possível renovar a sessão.', 0, error);
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function toThrownApiError(error: AxiosError): never {
  if (error.response) {
    throw toApiError(
      error.response.status,
      error.response.data,
      `Falha na requisição (${error.response.status})`,
    );
  }

  if (error.request) {
    throw new ApiError('Não foi possível conectar ao servidor.', 0, error.message);
  }

  throw new ApiError(error.message || 'Erro inesperado na requisição.', 0, error);
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 419 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        const headers = AxiosHeaders.from(originalRequest.headers ?? {});
        headers.set('Authorization', `Bearer ${accessToken}`);
        originalRequest.headers = headers;
        return api.request(originalRequest);
      } catch (refreshError) {
        throw refreshError;
      }
    }

    toThrownApiError(error);
  },
);

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, method = 'GET', ...rest } = options;

  const response = await api.request<T>({
    url: path,
    method,
    data: body,
    headers: {
      ...headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...rest,
  });

  return response.data;
}
