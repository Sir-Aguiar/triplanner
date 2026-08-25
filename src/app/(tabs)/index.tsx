import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AtmosphericBackground } from "@/components/atmospheric-background";
import { CloneTripModal } from "@/components/trips/clone-trip-modal";
import { TripCard } from "@/components/trips/trip-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import {
  BORDER_RADIUS,
  BottomTabInset,
  FontFamily,
  OPACITY,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "@/constants/theme";
import { useCloneTrip } from "@/hooks/use-clone-trip";
import { useSocialFeed } from "@/hooks/use-social-feed";
import { useTheme } from "@/hooks/use-theme";
import type { PublicFeedItemDto } from "@/dtos";
import type { TripListItem } from "@/hooks/use-trips";

function toTripListItem(item: PublicFeedItemDto): TripListItem {
  return {
    id: item.tripId,
    title: item.title,
    description: item.description,
    travelers: item.travelers,
    startDate: item.startDate,
    endDate: item.endDate,
    coverImage: item.coverImage,
    totalBudget: item.totalBudget,
    isPublic: true,
  };
}

function formatFeedMeta(item: PublicFeedItemDto): string {
  const daysLabel = `${item.durationDays} ${item.durationDays === 1 ? "dia" : "dias"}`;
  const activitiesLabel =
    item.activityCount === 1 ? "1 atividade" : `${item.activityCount} atividades`;
  return `${daysLabel} · ${activitiesLabel}`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    isLoggedIn,
    refresh,
    loadMore,
  } = useSocialFeed();
  const { cloneModalVisible, submitting, requestClone, confirmClone, closeCloneModal } =
    useCloneTrip();

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading || refreshing) {
      return;
    }
    void loadMore();
  }, [hasMore, loading, loadingMore, loadMore, refreshing]);

  return (
    <ThemedView style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.tripId}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            isLoggedIn ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refresh();
                }}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <ThemedText type="title" style={styles.headline}>
                  Explore
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.subcopy}>
                  Roteiros da comunidade para clonar e adaptar ao seu orçamento.
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Criar minha viagem"
                onPress={() => router.push("/nova-viagem")}
                style={({ pressed }) => [
                  styles.createCta,
                  SHADOWS.medium,
                  { backgroundColor: theme.primary, opacity: pressed ? OPACITY.pressed : 1 },
                ]}
              >
                <View style={styles.createCtaIcon}>
                  <SymbolView
                    name={{ ios: "plus", android: "add", web: "add" }}
                    size={22}
                    tintColor={theme.textInverse}
                    weight="medium"
                  />
                </View>
                <View style={styles.createCtaCopy}>
                  <ThemedText style={[styles.createCtaTitle, { color: theme.textInverse }]}>
                    Criar minha viagem
                  </ThemedText>
                  <ThemedText
                    style={[styles.createCtaSubtitle, { color: theme.textInverse }]}
                    numberOfLines={2}
                  >
                    Monte o roteiro do zero e publique quando quiser.
                  </ThemedText>
                </View>
                <SymbolView
                  name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                  size={18}
                  tintColor={theme.textInverse}
                  weight="medium"
                />
              </Pressable>

              <ThemedText type="subtitle" style={styles.feedTitle}>
                Feed de viagens
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TripCard
              trip={toTripListItem(item)}
              author={item.author}
              meta={formatFeedMeta(item)}
              hideVisibilityBadge
              onPress={(tripId) =>
                router.push({ pathname: '/viagem-publica/[id]', params: { id: tripId } })
              }
              onClone={(tripId) => {
                void requestClone(tripId);
              }}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <View style={styles.footerSpacer} />
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centeredState}>
                <ActivityIndicator color={theme.primary} size="large" />
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SymbolView
                  name={{ ios: "globe", android: "public", web: "public" }}
                  size={32}
                  tintColor={theme.secondary}
                  weight="medium"
                />
                <ThemedText type="smallBold" style={styles.emptyTitle}>
                  {!isLoggedIn
                    ? "Entre para ver o feed"
                    : error
                      ? "Não foi possível carregar"
                      : "Nenhum roteiro por aqui"}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  {!isLoggedIn
                    ? "Faça login para explorar viagens públicas de outros viajantes."
                    : error
                      ? error
                      : "Quando a comunidade publicar roteiros, eles aparecem aqui."}
                </ThemedText>
                <View style={styles.emptyActions}>
                  {!isLoggedIn ? (
                    <Button label="Entrar" variant="accent" onPress={() => router.push("/entrar")} />
                  ) : error ? (
                    <Button
                      label="Tentar de novo"
                      variant="secondary"
                      onPress={() => {
                        void refresh();
                      }}
                    />
                  ) : null}
                </View>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      <CloneTripModal
        visible={cloneModalVisible}
        submitting={submitting}
        onClose={closeCloneModal}
        onConfirm={(newStartDate) => {
          void confirmClone(newStartDate);
        }}
      />
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: BottomTabInset,
  },
  listEmpty: {
    flexGrow: 1,
  },
  header: {
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerCopy: {
    gap: SPACING.sm,
  },
  headline: {
    letterSpacing: -0.6,
  },
  subcopy: {
    maxWidth: 340,
  },
  createCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md + 2,
  },
  createCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  createCtaCopy: {
    flex: 1,
    gap: 2,
  },
  createCtaTitle: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  createCtaSubtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    opacity: 0.88,
  },
  feedTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
  separator: {
    height: SPACING.md,
  },
  footerLoading: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  footerSpacer: {
    height: SPACING.sm,
  },
  centeredState: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    gap: SPACING.sm,
    alignItems: "center",
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  emptyText: {
    textAlign: "center",
  },
  emptyActions: {
    width: "100%",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});
