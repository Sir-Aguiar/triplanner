import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrencyBrl } from '@/utils/currency';
import { formatDatePtBr } from '@/utils/dates';

export type ActivityListItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
  categoryName?: string;
  categoryColor?: string | null;
  notes?: string | null;
};

type ActivityTimelineProps = {
  activities: ActivityListItem[];
  emptyMessage?: string;
  /** Quando informado, exibe botão de excluir em cada item. */
  onDelete?: (activityId: string) => void;
};

export function ActivityTimeline({
  activities,
  emptyMessage = 'Nenhuma atividade ainda. Toque em + para adicionar.',
  onDelete,
}: ActivityTimelineProps) {
  const theme = useTheme();

  if (activities.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" type="small" style={styles.empty}>
        {emptyMessage}
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {activities.map((activity) => {
        const accent = activity.categoryColor || theme.primary;

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
                  <ThemedText type="smallBold" style={styles.title}>
                    {activity.title}
                  </ThemedText>
                  {activity.categoryName ? (
                    <ThemedText themeColor="textTertiary" type="small">
                      {activity.categoryName}
                    </ThemedText>
                  ) : null}
                </View>

                {onDelete ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir atividade ${activity.title}`}
                    hitSlop={SPACING.sm}
                    onPress={() => onDelete(activity.id)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
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

              {activity.cost > 0 ? (
                <ThemedText themeColor="textSecondary" type="small">
                  {formatCurrencyBrl(activity.cost)}
                  {activity.isPerPerson ? ' / pessoa' : ''}
                </ThemedText>
              ) : null}

              {activity.notes ? (
                <ThemedText themeColor="textTertiary" type="small" numberOfLines={2}>
                  {activity.notes}
                </ThemedText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  list: {
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
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
