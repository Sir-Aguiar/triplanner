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

/** Chave YYYY-MM-DD (calendário local derivado do ISO UTC de negócio). */
export function getDateKey(iso: string): string {
  const date = fromUtcIsoDate(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Número do dia da viagem (Dia 1 = data de início). */
export function getTripDayNumber(activityIso: string, tripStartIso: string): number {
  const activity = fromUtcIsoDate(activityIso);
  const start = fromUtcIsoDate(tripStartIso);
  const diffMs =
    Date.UTC(activity.getFullYear(), activity.getMonth(), activity.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

export function formatTripDayLabel(activityIso: string, tripStartIso: string): string {
  const dayNumber = getTripDayNumber(activityIso, tripStartIso);
  return `Dia ${dayNumber} - ${formatDatePtBr(activityIso)}`;
}
