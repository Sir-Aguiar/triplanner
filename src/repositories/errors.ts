export class RepositoryError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.cause = cause;
  }
}

export function toRepositoryError(error: unknown, fallbackMessage: string): RepositoryError {
  if (error instanceof RepositoryError) {
    return error;
  }

  const detail = error instanceof Error ? error.message : undefined;
  return new RepositoryError(detail ? `${fallbackMessage}: ${detail}` : fallbackMessage, error);
}
