export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }

    if (Array.isArray(record.message) && record.message.length > 0) {
      const first = record.message[0];
      if (typeof first === 'string') {
        return first;
      }
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }
  }

  return fallback;
}

export function toApiError(status: number, body: unknown, fallbackMessage: string): ApiError {
  return new ApiError(extractMessage(body, fallbackMessage), status, body);
}
