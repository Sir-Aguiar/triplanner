import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { TripListItem } from '@/hooks/use-trips';
import { BORDER_RADIUS, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrencyBrl } from '@/utils/currency';
import { formatDatePtBr } from '@/utils/dates';

type TripCardProps = {
  trip: TripListItem;
  onPress: (tripId: string) => void;
};

export function TripCard({ trip, onPress }: TripCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir viagem ${trip.title}`}
      onPress={() => onPress(trip.id)}
      style={({ pressed }) => [
        styles.card,
        SHADOWS.light,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? OPACITY.pressed : 1,
        },
      ]}>
      <View style={[styles.accent, { backgroundColor: theme.primary }]} />

      <View style={styles.body}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {trip.title}
        </ThemedText>

        <ThemedText themeColor="textSecondary" type="small">
          {formatDatePtBr(trip.startDate)} — {formatDatePtBr(trip.endDate)}
        </ThemedText>

        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
            <ThemedText themeColor="textSecondary" type="small" style={styles.chipText}>
              {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}
            </ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" type="smallBold">
            {trip.totalBudget > 0 ? formatCurrencyBrl(trip.totalBudget) : 'Sem custo'}
          </ThemedText>
        </View>

        {trip.description ? (
          <ThemedText themeColor="textTertiary" type="small" numberOfLines={2}>
            {trip.description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: SPACING.md + 2,
    gap: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
  },
  chipText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
});
