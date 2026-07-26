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
 * Mantém o orçamento previsto (`totalBudget`) coerente com o gasto realizado.
 * - US02: se ainda há folga, o previsto não muda.
 * - US03: se o gasto estoura o previsto, o previsto sobe para o novo total.
 */
export function syncBudgetWithSpent(
  currentBudget: number | null | undefined,
  spentTotal: number,
): number {
  return Math.max(currentBudget ?? 0, spentTotal);
}

/**
 * No formulário de criação: se o orçamento estava colado na soma das atividades,
 * continua acompanhando (inclusive para baixo). Caso contrário, só sobe no estouro (US03).
 */
export function reconcileFormBudget(
  currentBudget: number | null | undefined,
  previousSpent: number,
  nextSpent: number,
): number {
  const base = currentBudget ?? 0;
  if (base === previousSpent) {
    return nextSpent;
  }
  return Math.max(base, nextSpent);
}

export type BudgetProgress = {
  planned: number;
  spent: number;
  remaining: number;
  /** US02: exibe saldo. US03: oculto quando gasto >= previsto. */
  showRemaining: boolean;
  /** 0–1 para barra de progresso (limitado a 100%). */
  progressRatio: number;
};

/** Consolida previsto vs realizado vs saldo (RF2 / US02 / US03). */
export function resolveBudgetProgress(
  plannedBudget: number | null | undefined,
  spentTotal: number,
): BudgetProgress {
  const planned = Math.max(0, plannedBudget ?? 0);
  const spent = Math.max(0, spentTotal);
  const remaining = planned - spent;

  return {
    planned,
    spent,
    remaining: Math.max(0, remaining),
    showRemaining: planned > 0 && spent < planned,
    progressRatio: planned > 0 ? Math.min(1, spent / planned) : spent > 0 ? 1 : 0,
  };
}

export type CategoryCostBreakdownItem = {
  categoryId: string;
  categoryName: string;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  total: number;
};

type ActivityCategoryCostInput = {
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  effectiveCost?: number | null;
};

/** Agrupa gastos realizados por categoria (maior → menor). */
export function buildCategoryCostBreakdown(
  activities: ActivityCategoryCostInput[],
): CategoryCostBreakdownItem[] {
  const byCategory = new Map<string, CategoryCostBreakdownItem>();

  for (const activity of activities) {
    const total = activity.effectiveCost ?? 0;
    if (total <= 0) {
      continue;
    }

    const categoryId = activity.categoryId ?? 'unknown';
    const existing = byCategory.get(categoryId);
    if (existing) {
      existing.total += total;
      continue;
    }

    byCategory.set(categoryId, {
      categoryId,
      categoryName: activity.categoryName?.trim() || 'Sem categoria',
      categoryColor: activity.categoryColor,
      categoryIcon: activity.categoryIcon,
      total,
    });
  }

  return [...byCategory.values()].sort((a, b) => b.total - a.total);
}
