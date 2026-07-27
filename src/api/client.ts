import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

import { getApiBaseUrl } from '@/api/config';
import { ApiError, toApiError } from '@/api/errors';

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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
