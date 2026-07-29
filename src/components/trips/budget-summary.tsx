import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  resolveBudgetProgress,
  type CategoryCostBreakdownItem,
} from '@/utils/budget';
import { formatCurrencyBrl } from '@/utils/currency';

type BudgetSummaryProps = {
  totalBudget: number;
  spentTotal: number;
  costPerPerson: number;
  categoryBreakdown: CategoryCostBreakdownItem[];
};

export function BudgetSummary({
  totalBudget,
  spentTotal,
  costPerPerson,
  categoryBreakdown,
}: BudgetSummaryProps) {
  const theme = useTheme();
  const progress = resolveBudgetProgress(totalBudget, spentTotal);
  const hasFinancialData = progress.planned > 0 || progress.spent > 0;

  return (
    <View
      style={[
        styles.root,
        SHADOWS.light,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={styles.heading}>
        Orçamento
      </ThemedText>

      {!hasFinancialData ? (
        <ThemedText themeColor="textSecondary">Não informado</ThemedText>
      ) : (
        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <ThemedText themeColor="textSecondary" type="small">
              Previsto
            </ThemedText>
            <ThemedText type="smallBold">
              {progress.planned > 0 ? formatCurrencyBrl(progress.planned) : 'Não informado'}
            </ThemedText>
          </View>

          <View style={styles.metricRow}>
            <ThemedText themeColor="textSecondary" type="small">
              Gasto realizado
            </ThemedText>
            <ThemedText type="smallBold">{formatCurrencyBrl(progress.spent)}</ThemedText>
          </View>

          {progress.showRemaining ? (
            <View style={styles.metricRow}>
              <ThemedText themeColor="textSecondary" type="small">
                Saldo disponível
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.success }}>
                {formatCurrencyBrl(progress.remaining)}
              </ThemedText>
            </View>
          ) : null}

          {progress.planned > 0 ? (
            <View
              style={[styles.track, { backgroundColor: theme.surfaceMuted }]}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(progress.progressRatio * 100),
              }}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.round(progress.progressRatio * 100)}%`,
                    backgroundColor:
                      progress.progressRatio >= 1 ? theme.accent : theme.primary,
                  },
                ]}
              />
            </View>
          ) : null}

          {costPerPerson > 0 ? (
            <ThemedText themeColor="textTertiary" type="small">
              Custo por pessoa: {formatCurrencyBrl(costPerPerson)}
            </ThemedText>
          ) : null}
        </View>
      )}

      {categoryBreakdown.length > 0 ? (
        <View style={[styles.breakdown, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold">Por categoria</ThemedText>
          {categoryBreakdown.map((item) => {
            const share =
              progress.spent > 0 ? Math.round((item.total / progress.spent) * 100) : 0;

            return (
              <View key={item.categoryId} style={styles.categoryRow}>
                <View style={styles.categoryLabel}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: item.categoryColor ?? theme.textTertiary },
                    ]}
                  />
                  <ThemedText type="small" numberOfLines={1} style={styles.categoryName}>
                    {item.categoryName}
                  </ThemedText>
                  <ThemedText themeColor="textTertiary" type="small">
                    {share}%
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{formatCurrencyBrl(item.total)}</ThemedText>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  heading: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  metrics: {
    gap: SPACING.sm,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  track: {
    height: 8,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  breakdown: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  categoryLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minWidth: 0,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.pill,
  },
  categoryName: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
});
