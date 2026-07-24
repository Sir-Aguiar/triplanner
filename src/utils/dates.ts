/** Converte a data local selecionada no picker para ISO 8601 UTC (meia-noite). */
export function toUtcIsoDate(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
  ).toISOString();
}

/** Interpreta ISO UTC e reconstrói Date no calendário local (para o picker). */
export function fromUtcIsoDate(iso: string): Date {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function formatDatePtBr(iso: string): string {
  if (!iso) {
    return '';
  }

  return fromUtcIsoDate(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
