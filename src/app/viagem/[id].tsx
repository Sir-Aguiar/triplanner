import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { getDatabase } from '@/database';
import type Trip from '@/database/models/Trip';
import { useTheme } from '@/hooks/use-theme';
import { formatDatePtBr } from '@/utils/dates';

export default function ViagemDetalhesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Viagem não encontrada.');
      setLoading(false);
      return;
    }

    const database = getDatabase();
    const subscription = database
      .get<Trip>('trips')
      .findAndObserve(id)
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
  }, [id]);

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
          <View style={styles.content}>
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
                {trip.totalBudget > 0
                  ? trip.totalBudget.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : 'Não informado'}
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
                styles.activityPlaceholder,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}>
              <ThemedText type="smallBold">Atividades</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Pronto para adicionar a primeira atividade. O formulário virá no próximo passo.
              </ThemedText>
            </View>
          </View>
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
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
  activityPlaceholder: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
});
