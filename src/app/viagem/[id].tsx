import { LinearGradient } from 'expo-linear-gradient';
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

import { AtmosphericBackground } from '@/components/atmospheric-background';
import { ActivityFormModal } from '@/components/trips/activity-form-modal';
import {
  ActivityTimeline,
  type ActivityListItem,
} from '@/components/trips/activity-timeline';
import { BudgetSummary } from '@/components/trips/budget-summary';
import { TripFormModal } from '@/components/trips/trip-form-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/ui/toast';
import {
  BORDER_RADIUS,
  FontFamily,
  OPACITY,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTrip } from '@/hooks/use-trip';
import { useTripActivities } from '@/hooks/use-trip-activities';
import { activityService, tripService } from '@/services';
import { formatDatePtBr } from '@/utils/dates';

export default function ViagemDetalhesScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = typeof id === 'string' ? id : id?.[0];
  const { trip, loading, error } = useTrip(tripId);
  const {
    activities,
    loading: loadingActivities,
    spentTotal,
    costPerPerson,
    categoryBreakdown,
  } = useTripActivities(tripId);

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
      <AtmosphericBackground />
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
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, SHADOWS.medium]}>
                <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]}>
                  {trip.title}
                </ThemedText>
                <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                  {formatDatePtBr(trip.startDate)} — {formatDatePtBr(trip.endDate)}
                </ThemedText>
                <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                    {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}
                  </ThemedText>
                </View>
              </LinearGradient>

              <View style={styles.section}>
                <BudgetSummary
                  totalBudget={trip.totalBudget}
                  spentTotal={spentTotal}
                  costPerPerson={costPerPerson}
                  categoryBreakdown={categoryBreakdown}
                />
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTripModalOpen(true)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    SHADOWS.light,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">Editar</ThemedText>
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
                    Excluir
                  </ThemedText>
                </Pressable>
              </View>

              {trip.description ? (
                <View
                  style={[
                    styles.descriptionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <ThemedText type="smallBold">Descrição</ThemedText>
                  <ThemedText themeColor="textSecondary">{trip.description}</ThemedText>
                </View>
              ) : null}

              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.timelineHeading}>
                  Linha do tempo
                </ThemedText>
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
                SHADOWS.medium,
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
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
  },
  heroMeta: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    opacity: 0.92,
  },
  heroChip: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
  },
  heroChipText: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  descriptionCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  section: {
    gap: SPACING.md,
  },
  timelineHeading: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
