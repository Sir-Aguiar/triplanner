import { RepositoryError } from '@/repositories/errors';

export class ServiceError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.cause = cause;
  }
}

export function toServiceError(error: unknown, fallbackMessage: string): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }

  if (error instanceof RepositoryError) {
    return new ServiceError(error.message, error);
  }

  const detail = error instanceof Error ? error.message : undefined;
  return new ServiceError(detail ? `${fallbackMessage}: ${detail}` : fallbackMessage, error);
}
