import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AtmosphericBackground } from "@/components/atmospheric-background";
import { TripCard } from "@/components/trips/trip-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { BORDER_RADIUS, BottomTabInset, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getTripLane, useTrips, type TripLane, type TripListItem } from "@/hooks/use-trips";

type ListRow = { type: "header"; key: string; title: string } | { type: "trip"; key: string; trip: TripListItem };

const LANE_TITLES: Record<TripLane, string> = {
  future: "Viagens futuras",
  ongoing: "Em andamento",
  past: "Viagens passadas",
};

const LANE_SEQUENCE: TripLane[] = ["future", "ongoing", "past"];

function buildTripListRows(trips: TripListItem[]): ListRow[] {
  const buckets: Record<TripLane, TripListItem[]> = {
    future: [],
    ongoing: [],
    past: [],
  };

  for (const trip of trips) {
    buckets[getTripLane(trip)].push(trip);
  }

  const rows: ListRow[] = [];
  for (const lane of LANE_SEQUENCE) {
    const items = buckets[lane];
    if (items.length === 0) {
      continue;
    }

    rows.push({ type: "header", key: `header-${lane}`, title: LANE_TITLES[lane] });
    for (const trip of items) {
      rows.push({ type: "trip", key: trip.id, trip });
    }
  }

  return rows;
}

export default function ViagensScreen() {
  const theme = useTheme();
  const { trips, ready } = useTrips();
  const rows = useMemo(() => buildTripListRows(trips), [trips]);

  return (
    <ThemedView style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <ThemedText type="subtitle">Minhas Viagens</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {!ready || trips.length === 0
                ? "Seus roteiros ficam aqui"
                : `${trips.length} ${trips.length === 1 ? "roteiro" : "roteiros"}`}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cadastrar viagem"
            hitSlop={SPACING.md}
            onPress={() => router.push("/nova-viagem")}
            style={({ pressed }) => [
              styles.addButton,
              SHADOWS.light,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: "plus", android: "add" }}
              size={TYPOGRAPHY.sizes.xl}
              tintColor={theme.textInverse}
              weight="medium"
            />
          </Pressable>
        </View>

        <FlatList
          data={ready ? rows : []}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, ready && trips.length === 0 && styles.listEmpty]}
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.type === "trip" ? <View style={styles.separator} /> : null
          }
          renderItem={({ item, index }) => {
            if (item.type === "header") {
              return (
                <ThemedText
                  themeColor="textSecondary"
                  type="smallBold"
                  style={[styles.sectionTitle, index === 0 && styles.sectionTitleFirst]}
                >
                  {item.title}
                </ThemedText>
              );
            }

            return (
              <TripCard
                trip={item.trip}
                onPress={(tripId) =>
                  router.push({
                    pathname: "/viagem/[id]",
                    params: { id: tripId },
                  })
                }
              />
            );
          }}
          ListEmptyComponent={
            ready ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SymbolView
                  name={{ ios: "map", android: "map", web: "map" }}
                  size={32}
                  tintColor={theme.secondary}
                  weight="medium"
                />
                <ThemedText type="smallBold" style={styles.emptyTitle}>
                  Nenhuma viagem ainda
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Comece do zero ou inspire-se em roteiros da comunidade.
                </ThemedText>
                <View style={styles.emptyActions}>
                  <Button
                    label="Criar minha primeira viagem"
                    variant="accent"
                    onPress={() => router.push("/nova-viagem")}
                  />
                  <Button
                    label="Explorar viagens da comunidade"
                    variant="secondary"
                    onPress={() => router.push("/(tabs)/explore")}
                  />
                </View>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
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
    paddingBottom: BottomTabInset,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerCopy: {
    gap: SPACING.xs,
    flex: 1,
    paddingRight: SPACING.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: OPACITY.pressed,
    transform: [{ scale: 0.96 }],
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  separator: {
    height: SPACING.md,
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  sectionTitleFirst: {
    marginTop: 0,
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

