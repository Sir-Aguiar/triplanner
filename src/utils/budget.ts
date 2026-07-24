/** Soma os custos das atividades (usa o valor informado em cada uma). */
export function sumActivityCosts(activities: Array<{ cost?: number | null }>): number {
  return activities.reduce((total, activity) => total + (activity.cost ?? 0), 0);
}

/**
 * Ao adicionar uma atividade, o custo da viagem sobe pelo valor da atividade,
 * sem nunca ficar abaixo da soma das atividades.
 */
export function applyActivityCostToBudget(
  currentBudget: number | null | undefined,
  activityCost: number,
  activitiesSumAfterAdd: number,
): number {
  const base = currentBudget ?? 0;
  return Math.max(base + activityCost, activitiesSumAfterAdd);
}

/**
 * Ao remover uma atividade, reduz o custo da viagem pelo valor removido,
 * mantendo o piso da soma restante.
 */
export function applyActivityRemovalFromBudget(
  currentBudget: number | null | undefined,
  removedCost: number,
  activitiesSumAfterRemove: number,
): number {
  const base = currentBudget ?? 0;
  return Math.max(base - removedCost, activitiesSumAfterRemove);
}
