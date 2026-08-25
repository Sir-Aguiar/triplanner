import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { HoldToDeleteButton } from '@/components/ui/hold-to-delete-button';
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
import { resolveCoverImageUri } from '@/utils/cover-image';
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
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
  }, [trip?.coverImage]);

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

  const handleAddCover = async () => {
    if (!trip || busy) {
      return;
    }

    setBusy(true);
    try {
      const updated = await tripService.setCoverFromGallery(trip.id);
      if (updated) {
        setCoverFailed(false);
        showToast('Capa atualizada');
      }
    } catch (coverError) {
      console.error('Falha ao definir capa:', coverError);
      showToast('Não foi possível adicionar a capa.');
    } finally {
      setBusy(false);
    }
  };

  const coverUri = trip ? resolveCoverImageUri(trip.coverImage) : null;
  const showCover = Boolean(coverUri) && !coverFailed;

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
              <View style={[styles.hero, SHADOWS.medium]}>
                {showCover && coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={styles.heroCover}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                    onError={() => setCoverFailed(true)}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.primary }]} />
                )}

                {showCover ? (
                  <View style={[styles.heroScrim, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                ) : null}

                <View style={styles.heroContent}>
                  <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]}>
                    {trip.title}
                  </ThemedText>
                  <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                    {formatDatePtBr(trip.startDate)} — {formatDatePtBr(trip.endDate)}
                  </ThemedText>
                  <View style={styles.heroChips}>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                        {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}
                      </ThemedText>
                    </View>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                        {trip.isPublic ? 'Pública' : 'Privada'}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showCover ? 'Alterar capa' : 'Adicionar capa'}
                  onPress={() => {
                    void handleAddCover();
                  }}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.coverButton,
                    { backgroundColor: theme.surface },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    name={{ ios: 'photo.on.rectangle', android: 'add_photo_alternate', web: 'image' }}
                    size={16}
                    tintColor={theme.textSecondary}
                    weight="medium"
                  />
                  <ThemedText type="smallBold" themeColor="textSecondary" numberOfLines={1}>
                    {showCover ? 'Alterar capa' : 'Adicionar capa'}
                  </ThemedText>
                </Pressable>
              </View>

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
                  <ThemedText type="smallBold" numberOfLines={1}>
                    Editar
                  </ThemedText>
                </Pressable>

                <HoldToDeleteButton
                  label="Excluir"
                  disabled={busy}
                  onHoldComplete={() => {
                    void handleDeleteTrip();
                  }}
                  style={styles.deleteButton}
                />
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
                tintColor={theme.textOnAccent}
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
                isPublic: trip.isPublic,
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
    minHeight: 200,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroCover: {
    ...StyleSheet.absoluteFill,
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
  },
  heroContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    zIndex: 1,
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
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  heroChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
  },
  heroChipText: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  coverButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.light,
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
  deleteButton: {
    flex: 1,
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
