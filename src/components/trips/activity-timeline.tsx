import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrencyBrl } from '@/utils/currency';
import { formatDatePtBr, formatTripDayLabel, getDateKey } from '@/utils/dates';

export type ActivityListItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  notes?: string | null;
  /** Custo efetivo no orçamento (já considera viajantes se for por pessoa). */
  effectiveCost?: number;
};

type ActivityDayGroup = {
  key: string;
  label: string;
  activities: ActivityListItem[];
};

type ActivityTimelineProps = {
  activities: ActivityListItem[];
  emptyMessage?: string;
  tripStartDate?: string;
  travelers?: number;
  /** Modo simples: só excluir (ex.: fila pendente no cadastro). */
  onDelete?: (activityId: string) => void;
  /** Modo completo: menu Editar / Excluir. */
  onEdit?: (activity: ActivityListItem) => void;
  onRequestDelete?: (activity: ActivityListItem) => void;
};

function groupActivitiesByDay(
  activities: ActivityListItem[],
  tripStartDate?: string,
): ActivityDayGroup[] {
  const sorted = [...activities].sort(
    (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
  );
  const groups = new Map<string, ActivityListItem[]>();

  for (const activity of sorted) {
    const key = getDateKey(activity.startTime);
    const current = groups.get(key) ?? [];
    current.push(activity);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: tripStartDate
      ? formatTripDayLabel(items[0].startTime, tripStartDate)
      : formatDatePtBr(items[0].startTime),
    activities: items,
  }));
}

export function ActivityTimeline({
  activities,
  emptyMessage = 'Nenhuma atividade ainda. Toque em + para adicionar.',
  tripStartDate,
  onDelete,
  onEdit,
  onRequestDelete,
}: ActivityTimelineProps) {
  const theme = useTheme();
  const [menuActivity, setMenuActivity] = useState<ActivityListItem | null>(null);
  const groups = useMemo(
    () => groupActivitiesByDay(activities, tripStartDate),
    [activities, tripStartDate],
  );

  if (activities.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" type="small" style={styles.empty}>
        {emptyMessage}
      </ThemedText>
    );
  }

  const showMenu = Boolean(onEdit || onRequestDelete);

  return (
    <View style={styles.list}>
      {groups.map((group) => (
        <View key={group.key} style={styles.dayGroup}>
          <ThemedText type="smallBold" style={styles.dayLabel}>
            {group.label}
          </ThemedText>

          <View style={styles.dayCards}>
            {group.activities.map((activity) => {
              const accent = activity.categoryColor || theme.primary;
              const displayCost =
                activity.effectiveCost ??
                (activity.isPerPerson ? undefined : activity.cost);

              return (
                <View
                  key={activity.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={[styles.accent, { backgroundColor: accent }]} />
                  <View style={styles.body}>
                    <View style={styles.topRow}>
                      <View style={styles.titleBlock}>
                        <View style={styles.titleRow}>
                          <View style={[styles.iconDot, { backgroundColor: accent }]} />
                          <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
                            {activity.title}
                          </ThemedText>
                        </View>
                        {activity.categoryName ? (
                          <ThemedText themeColor="textTertiary" type="small">
                            {activity.categoryName}
                          </ThemedText>
                        ) : null}
                      </View>

                      {showMenu ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Opções da atividade ${activity.title}`}
                          hitSlop={SPACING.sm}
                          onPress={() => setMenuActivity(activity)}
                          style={({ pressed }) => [
                            styles.menuButton,
                            pressed && styles.pressed,
                          ]}>
                          <SymbolView
                            name={{
                              ios: 'ellipsis',
                              android: 'more_vert',
                              web: 'more_vert',
                            }}
                            size={TYPOGRAPHY.sizes.lg}
                            tintColor={theme.textSecondary}
                            weight="medium"
                          />
                        </Pressable>
                      ) : onDelete ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Excluir atividade ${activity.title}`}
                          hitSlop={SPACING.sm}
                          onPress={() => onDelete(activity.id)}
                          style={({ pressed }) => [
                            styles.menuButton,
                            pressed && styles.pressed,
                          ]}>
                          <SymbolView
                            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                            size={TYPOGRAPHY.sizes.md}
                            tintColor={theme.error}
                            weight="medium"
                          />
                        </Pressable>
                      ) : null}
                    </View>

                    <ThemedText themeColor="textSecondary" type="small">
                      {formatDatePtBr(activity.startTime)}
                      {activity.endTime && activity.endTime !== activity.startTime
                        ? ` — ${formatDatePtBr(activity.endTime)}`
                        : ''}
                    </ThemedText>

                    {(displayCost ?? 0) > 0 || activity.cost > 0 ? (
                      <ThemedText themeColor="textSecondary" type="small">
                        {formatCurrencyBrl(
                          displayCost ??
                            (activity.isPerPerson ? activity.cost : activity.cost),
                        )}
                        {activity.isPerPerson
                          ? ` (${formatCurrencyBrl(activity.cost)} / pessoa)`
                          : ''}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <Modal
        transparent
        animationType="fade"
        visible={menuActivity != null}
        onRequestClose={() => setMenuActivity(null)}>
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuActivity(null)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu">
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.menuSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {menuActivity?.title}
            </ThemedText>

            {onEdit && menuActivity ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const target = menuActivity;
                  setMenuActivity(null);
                  onEdit(target);
                }}
                style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
                <ThemedText>Editar</ThemedText>
              </Pressable>
            ) : null}

            {onRequestDelete && menuActivity ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const target = menuActivity;
                  setMenuActivity(null);
                  onRequestDelete(target);
                }}
                style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
                <ThemedText style={{ color: theme.error }}>Excluir</ThemedText>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  list: {
    gap: SPACING.lg,
  },
  dayGroup: {
    gap: SPACING.sm,
  },
  dayLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  dayCards: {
    gap: SPACING.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.pill,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: SPACING.lg,
  },
  menuSheet: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  menuAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
