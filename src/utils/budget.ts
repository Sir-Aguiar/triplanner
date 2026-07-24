export type ActivityCostInput = {
  cost?: number | null;
  isPerPerson?: boolean;
};

/**
 * Custo efetivo da atividade no orçamento da viagem.
 * Se `isPerPerson`, multiplica pelo número de viajantes.
 */
export function resolveActivityTotalCost(
  activity: ActivityCostInput,
  travelers: number,
): number {
  const cost = activity.cost ?? 0;
  if (cost <= 0) {
    return 0;
  }

  const people = Math.max(1, travelers);

  return activity.isPerPerson ? cost * people : cost;
}

/** Soma o custo efetivo de todas as atividades (respeitando custo por pessoa). */
export function sumActivityCosts(
  activities: ActivityCostInput[],
  travelers: number,
): number {
  return activities.reduce(
    (total, activity) => total + resolveActivityTotalCost(activity, travelers),
    0,
  );
}

/**
 * Custo da atividade na visão "por pessoa".
 * - Custo compartilhado: divide pelo número de viajantes.
 * - Custo por pessoa: mantém o valor informado.
 */
export function resolveActivityCostPerPerson(
  activity: ActivityCostInput,
  travelers: number,
): number {
  const cost = activity.cost ?? 0;
  if (cost <= 0) {
    return 0;
  }

  const people = Math.max(1, travelers);
  return activity.isPerPerson ? cost : cost / people;
}

/** Soma o custo por pessoa de todas as atividades. */
export function sumActivityCostsPerPerson(
  activities: ActivityCostInput[],
  travelers: number,
): number {
  return activities.reduce(
    (total, activity) => total + resolveActivityCostPerPerson(activity, travelers),
    0,
  );
}

/**
 * Ao adicionar/alterar uma atividade, o custo da viagem sobe pela contribuição efetiva,
 * sem nunca ficar abaixo da soma das atividades.
 */
export function applyActivityCostToBudget(
  currentBudget: number | null | undefined,
  activityContribution: number,
  activitiesSumAfterChange: number,
): number {
  const base = currentBudget ?? 0;
  return Math.max(base + activityContribution, activitiesSumAfterChange);
}

/**
 * Ao remover uma atividade, reduz o custo da viagem pela contribuição efetiva removida,
 * mantendo o piso da soma restante.
 */
export function applyActivityRemovalFromBudget(
  currentBudget: number | null | undefined,
  removedContribution: number,
  activitiesSumAfterRemove: number,
): number {
  const base = currentBudget ?? 0;
  return Math.max(base - removedContribution, activitiesSumAfterRemove);
}

/**
 * Ajusta o orçamento quando muda a quantidade de viajantes
 * (atividades por pessoa alteram a soma efetiva).
 */
export function applyTravelersChangeToBudget(
  currentBudget: number | null | undefined,
  previousSum: number,
  nextSum: number,
): number {
  const base = currentBudget ?? 0;
  const delta = nextSum - previousSum;
  return Math.max(base + delta, nextSum);
}
