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

const MONTHS_SHORT_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

/** Período compacto para cards (ex.: "12 a 20 de Out, 2026"). */
export function formatTripPeriod(startIso: string, endIso: string): string {
  if (!startIso || !endIso) {
    return '';
  }

  const start = fromUtcIsoDate(startIso);
  const end = fromUtcIsoDate(endIso);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTHS_SHORT_PT[start.getMonth()];
  const endMonth = MONTHS_SHORT_PT[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear && start.getMonth() === end.getMonth()) {
    return `${startDay} a ${endDay} de ${startMonth}, ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth}, ${startYear}`;
  }

  return `${startDay} de ${startMonth}, ${startYear} a ${endDay} de ${endMonth}, ${endYear}`;
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
