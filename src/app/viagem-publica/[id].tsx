import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AtmosphericBackground } from '@/components/atmospheric-background';
import {
  ActivityTimeline,
  type ActivityListItem,
} from '@/components/trips/activity-timeline';
import { BudgetSummary } from '@/components/trips/budget-summary';
import { CloneTripModal } from '@/components/trips/clone-trip-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import {
  BORDER_RADIUS,
  FontFamily,
  OPACITY,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import type { PublicTripActivityDto, PublicTripDto } from '@/dtos';
import { useCloneTrip } from '@/hooks/use-clone-trip';
import { usePublicTrip } from '@/hooks/use-public-trip';
import { useTheme } from '@/hooks/use-theme';
import {
  buildCategoryCostBreakdown,
  resolveActivityTotalCost,
  sumActivityCosts,
  sumActivityCostsPerPerson,
} from '@/utils/budget';
import { resolveCoverImageUri } from '@/utils/cover-image';
import { formatDatePtBr } from '@/utils/dates';

function toActivityListItem(
  activity: PublicTripActivityDto,
  travelers: number,
): ActivityListItem {
  return {
    id: activity.activityId,
    title: activity.title,
    startTime: activity.startTime,
    endTime: activity.endTime,
    cost: activity.cost,
    isPerPerson: activity.isPerPerson,
    categoryId: activity.categoryId,
    categoryName: activity.category.name,
    categoryColor: activity.category.color,
    categoryIcon: activity.category.icon,
    notes: activity.notes || null,
    effectiveCost: resolveActivityTotalCost(activity, travelers),
  };
}

function buildBudgetProps(trip: PublicTripDto) {
  const costInputs = trip.activities.map((activity) => ({
    cost: activity.cost,
    isPerPerson: activity.isPerPerson,
  }));

  return {
    spentTotal: sumActivityCosts(costInputs, trip.travelers),
    costPerPerson: sumActivityCostsPerPerson(costInputs, trip.travelers),
    categoryBreakdown: buildCategoryCostBreakdown(
      trip.activities.map((activity) => ({
        categoryId: activity.categoryId,
        categoryName: activity.category.name,
        categoryColor: activity.category.color,
        categoryIcon: activity.category.icon,
        effectiveCost: resolveActivityTotalCost(activity, trip.travelers),
      })),
    ),
  };
}

export default function ViagemPublicaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = typeof id === 'string' ? id : id?.[0];
  const { trip, loading, error, refresh } = usePublicTrip(tripId);
  const { cloneModalVisible, submitting, requestClone, confirmClone, closeCloneModal } =
    useCloneTrip();
  const [coverFailed, setCoverFailed] = useState(false);

  const activities = useMemo(
    () => (trip ? trip.activities.map((item) => toActivityListItem(item, trip.travelers)) : []),
    [trip],
  );
  const budget = useMemo(() => (trip ? buildBudgetProps(trip) : null), [trip]);

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
        ) : error || !trip || !budget ? (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary" style={styles.errorText}>
              {error ?? 'Roteiro não encontrado.'}
            </ThemedText>
            <Button
              label="Tentar de novo"
              variant="secondary"
              onPress={() => {
                void refresh();
              }}
            />
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
                  <ThemedText style={[styles.heroEyebrow, { color: theme.textInverse }]}>
                    {trip.author.name.trim() || `@${trip.author.username}`}
                    {trip.author.name.trim() && trip.author.username
                      ? ` · @${trip.author.username}`
                      : ''}
                  </ThemedText>
                  <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]}>
                    {trip.title}
                  </ThemedText>
                  <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                    {formatDatePtBr(trip.startDate)} — {formatDatePtBr(trip.endDate)}
                  </ThemedText>
                  <View style={styles.heroChips}>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                        {trip.durationDays} {trip.durationDays === 1 ? 'dia' : 'dias'}
                      </ThemedText>
                    </View>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                        {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}
                      </ThemedText>
                    </View>
                    <View style={[styles.heroChip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <ThemedText style={[styles.heroChipText, { color: theme.textInverse }]}>
                        {trip.activityCount}{' '}
                        {trip.activityCount === 1 ? 'atividade' : 'atividades'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <BudgetSummary
                  totalBudget={trip.totalBudget}
                  spentTotal={budget.spentTotal}
                  costPerPerson={budget.costPerPerson}
                  categoryBreakdown={budget.categoryBreakdown}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clonar este roteiro"
                onPress={() => {
                  void requestClone(trip.tripId);
                }}
                style={({ pressed }) => [
                  styles.cloneCta,
                  SHADOWS.medium,
                  {
                    backgroundColor: theme.accent,
                    opacity: pressed ? OPACITY.pressed : 1,
                  },
                ]}>
                <SymbolView
                  name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                  size={18}
                  tintColor={theme.textOnAccent}
                  weight="medium"
                />
                <ThemedText style={[styles.cloneCtaLabel, { color: theme.textOnAccent }]}>
                  Clonar este roteiro
                </ThemedText>
              </Pressable>

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
                <ActivityTimeline
                  activities={activities}
                  emptyMessage="Este roteiro ainda não tem atividades."
                  tripStartDate={trip.startDate}
                  travelers={trip.travelers}
                />
              </View>
            </ScrollView>

            <CloneTripModal
              visible={cloneModalVisible}
              submitting={submitting}
              onClose={closeCloneModal}
              onConfirm={(newStartDate) => {
                void confirmClone(newStartDate);
              }}
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
    gap: SPACING.md,
  },
  errorText: {
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  hero: {
    borderRadius: BORDER_RADIUS.xl,
    minHeight: 220,
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
  heroEyebrow: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
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
  section: {
    gap: SPACING.md,
  },
  cloneCta: {
    minHeight: 52,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cloneCtaLabel: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  descriptionCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  timelineHeading: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
});
