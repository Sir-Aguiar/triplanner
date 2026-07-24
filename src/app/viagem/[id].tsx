import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityFormModal } from '@/components/trips/activity-form-modal';
import { ActivityTimeline } from '@/components/trips/activity-timeline';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BORDER_RADIUS,
  OPACITY,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { getDatabase } from '@/database';
import type Trip from '@/database/models/Trip';
import { useTheme } from '@/hooks/use-theme';
import { useTripActivities } from '@/hooks/use-trip-activities';
import { formatCurrencyBrl } from '@/utils/currency';
import { formatDatePtBr } from '@/utils/dates';

export default function ViagemDetalhesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = typeof id === 'string' ? id : id?.[0];
  const { activities, loading: loadingActivities } = useTripActivities(tripId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setError('Viagem não encontrada.');
      setLoading(false);
      return;
    }

    const database = getDatabase();
    const subscription = database
      .get<Trip>('trips')
      .findAndObserve(tripId)
      .subscribe({
        next: (record) => {
          setTrip(record);
          setLoading(false);
          setError(null);
        },
        error: () => {
          setTrip(null);
          setLoading(false);
          setError('Não foi possível carregar esta viagem.');
        },
      });

    return () => subscription.unsubscribe();
  }, [tripId]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : error || !trip ? (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary">{error ?? 'Viagem não encontrada.'}</ThemedText>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}>
              <View style={[styles.hero, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]}>
                  {trip.title}
                </ThemedText>
                <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                  {formatDatePtBr(trip.startDate)} — {formatDatePtBr(trip.endDate)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Viajantes</ThemedText>
                <ThemedText themeColor="textSecondary">{trip.travelers}</ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Custo total previsto</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {trip.totalBudget > 0 ? formatCurrencyBrl(trip.totalBudget) : 'Não informado'}
                </ThemedText>
              </View>

              {trip.description ? (
                <View style={styles.section}>
                  <ThemedText type="smallBold">Descrição</ThemedText>
                  <ThemedText themeColor="textSecondary">{trip.description}</ThemedText>
                </View>
              ) : null}

              <View
                style={[
                  styles.activitiesSection,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                ]}>
                <View style={styles.activitiesHeader}>
                  <ThemedText type="smallBold">Atividades</ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar atividade"
                    onPress={() => setActivityModalOpen(true)}
                    style={({ pressed }) => [
                      styles.addButton,
                      { backgroundColor: theme.accent },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'plus', android: 'add' }}
                      size={TYPOGRAPHY.sizes.md}
                      tintColor={theme.textInverse}
                      weight="medium"
                    />
                  </Pressable>
                </View>

                {loadingActivities ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <ActivityTimeline activities={activities} />
                )}
              </View>
            </ScrollView>

            <ActivityFormModal
              visible={activityModalOpen}
              tripId={trip.id}
              onClose={() => setActivityModalOpen(false)}
            />
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  hero: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  heroMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    opacity: 0.9,
  },
  section: {
    gap: SPACING.xs,
  },
  activitiesSection: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  activitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
