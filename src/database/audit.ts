/** RN03 — na API do app usamos ISO 8601 UTC; no SQLite o Watermelon guarda ms (number). */

export function nowIsoUtc(): string {
  return new Date().toISOString();
}

export function nowTimestampMs(): number {
  return Date.now();
}

export function toIsoUtc(value: Date | number | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return new Date(value).toISOString();
}

export function toTimestampMs(value: Date | number | string): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return Date.parse(value);
}
