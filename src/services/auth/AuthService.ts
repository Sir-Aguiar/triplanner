import { api, ApiError, type ApiAuthRequestConfig } from '@/api';
import type { AuthTokensResponse, RefreshTokensResponse } from '@/@types/Auth';
import type { SignInDTO, SignUpDTO } from '@/dtos';
import { ServiceError, toServiceError } from '@/services/errors';
import type { AxiosRequestConfig } from 'axios';

export class AuthService {
  async signUp(payload: SignUpDTO): Promise<AuthTokensResponse> {
    try {
      const { data } = await api.post<AuthTokensResponse>('/auth/signup', payload);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new ServiceError(error.message || 'Usuário ou e-mail já cadastrado.', error);
        }

        if (error.status === 400 || error.status === 422) {
          throw new ServiceError(error.message || 'Dados de cadastro inválidos.', error);
        }

        throw new ServiceError(error.message || 'Não foi possível criar a conta.', error);
      }

      throw toServiceError(error, 'Não foi possível criar a conta');
    }
  }

  async signIn(payload: SignInDTO): Promise<AuthTokensResponse> {
    try {
      const { data } = await api.post<AuthTokensResponse>('/auth/signin', payload);
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new ServiceError('E-mail/usuário ou senha inválidos.', error);
        }

        if (error.status === 400 || error.status === 422) {
          throw new ServiceError(error.message || 'Dados de login inválidos.', error);
        }

        throw new ServiceError(error.message || 'Não foi possível entrar.', error);
      }

      throw toServiceError(error, 'Não foi possível entrar');
    }
  }

  async refresh(refreshToken: string): Promise<RefreshTokensResponse> {
    try {
      const { data } = await api.post<RefreshTokensResponse>(
        '/auth/refresh',
        { refreshToken },
        { _skipAuthRefresh: true } as AxiosRequestConfig & ApiAuthRequestConfig,
      );
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new ServiceError('Sessão expirada. Faça login novamente.', error);
        }

        throw new ServiceError(error.message || 'Não foi possível renovar a sessão.', error);
      }

      throw toServiceError(error, 'Não foi possível renovar a sessão');
    }
  }
}

export const authService = new AuthService();
