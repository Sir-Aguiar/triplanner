import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityFormModal } from '@/components/trips/activity-form-modal';
import {
  ActivityTimeline,
  type ActivityListItem,
} from '@/components/trips/activity-timeline';
import { TripFormModal } from '@/components/trips/trip-form-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/ui/toast';
import {
  BORDER_RADIUS,
  OPACITY,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTrip } from '@/hooks/use-trip';
import { useTripActivities } from '@/hooks/use-trip-activities';
import { activityService, tripService } from '@/services';
import { formatCurrencyBrl } from '@/utils/currency';
import { formatDatePtBr } from '@/utils/dates';

export default function ViagemDetalhesScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = typeof id === 'string' ? id : id?.[0];
  const { trip, loading, error } = useTrip(tripId);
  const { activities, loading: loadingActivities, spentTotal, costPerPerson } =
    useTripActivities(tripId);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityListItem | null>(null);
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmDeleteTrip = () => {
    Alert.alert(
      'Excluir viagem',
      'Tem certeza que deseja excluir? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void handleDeleteTrip();
          },
        },
      ],
    );
  };

  const confirmDeleteActivity = (activity: ActivityListItem) => {
    Alert.alert(
      'Excluir atividade',
      'Tem certeza que deseja excluir? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void handleDeleteActivity(activity.id);
          },
        },
      ],
    );
  };

  const handleDeleteTrip = async () => {
    if (!trip || busy) {
      return;
    }

    setBusy(true);
    try {
      await tripService.delete(trip.id);
      showToast('Viagem excluída');
      router.replace('/(tabs)/viagens');
    } catch (deleteError) {
      console.error('Falha ao excluir viagem:', deleteError);
      showToast('Não foi possível excluir a viagem.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      await activityService.delete(activityId);
      showToast('Atividade excluída');
    } catch (deleteError) {
      console.error('Falha ao excluir atividade:', deleteError);
      showToast('Não foi possível excluir a atividade.');
    } finally {
      setBusy(false);
    }
  };

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
                <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                  {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Custo total da viagem</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {trip.totalBudget > 0 ? formatCurrencyBrl(trip.totalBudget) : 'Não informado'}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Custo por pessoa</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {costPerPerson > 0 ? formatCurrencyBrl(costPerPerson) : 'Não informado'}
                </ThemedText>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTripModalOpen(true)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">Editar Viagem</ThemedText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirmDeleteTrip}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.error,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.error }}>
                    Excluir Viagem
                  </ThemedText>
                </Pressable>
              </View>

              {trip.description ? (
                <View style={styles.section}>
                  <ThemedText type="smallBold">Descrição</ThemedText>
                  <ThemedText themeColor="textSecondary">{trip.description}</ThemedText>
                </View>
              ) : null}

              <View style={styles.section}>
                <ThemedText type="smallBold">Linha do tempo</ThemedText>
                {loadingActivities ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <ActivityTimeline
                    activities={activities}
                    tripStartDate={trip.startDate}
                    travelers={trip.travelers}
                    onEdit={(item) => {
                      setEditingActivity(item);
                      setActivityModalOpen(true);
                    }}
                    onRequestDelete={confirmDeleteActivity}
                  />
                )}
              </View>
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar atividade"
              onPress={() => {
                setEditingActivity(null);
                setActivityModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add' }}
                size={TYPOGRAPHY.sizes.xl}
                tintColor={theme.textInverse}
                weight="medium"
              />
            </Pressable>

            <ActivityFormModal
              visible={activityModalOpen}
              tripId={trip.id}
              activity={editingActivity}
              onClose={() => {
                setActivityModalOpen(false);
                setEditingActivity(null);
              }}
            />

            <TripFormModal
              visible={tripModalOpen}
              trip={{
                id: trip.id,
                title: trip.title,
                description: trip.description,
                travelers: trip.travelers,
                startDate: trip.startDate,
                endDate: trip.endDate,
                totalBudget: trip.totalBudget,
              }}
              activitiesCostSum={spentTotal}
              onClose={() => setTripModalOpen(false)}
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
    paddingBottom: SPACING.xxxl * 2,
    gap: SPACING.lg,
  },
  hero: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  heroMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    opacity: 0.92,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  section: {
    gap: SPACING.md,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
