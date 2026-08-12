import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AtmosphericBackground } from "@/components/atmospheric-background";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { BORDER_RADIUS, BottomTabInset, FontFamily, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useSession } from "@/contexts/session";
import { useTheme } from "@/hooks/use-theme";
import { useTrips } from "@/hooks/use-trips";
import { formatDatePtBr } from "@/utils/dates";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeScreen() {
  const theme = useTheme();
  const { user, isLoggedIn } = useSession();
  const { trips, ready } = useTrips();

  const { upcoming, nextTrip } = useMemo(() => {
    const now = Date.now();
    const upcomingTrips = trips.filter((trip) => Date.parse(trip.endDate) >= now).slice(0, 3);
    return {
      upcoming: upcomingTrips,
      nextTrip: upcomingTrips[0] ?? null,
    };
  }, [trips]);

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <ThemedView style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCopy}>
            <ThemedText themeColor="textSecondary" type="small" style={styles.greeting}>
              {greetingForNow()}
              {isLoggedIn && firstName ? `, ${firstName}` : ""}
            </ThemedText>
            <ThemedText type="title" style={styles.headline}>
              Sua próxima{"\n"}aventura
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subcopy}>
              Organize roteiros, orçamento e momentos em um só lugar.
            </ThemedText>
          </View>

          <LinearGradient
            colors={[theme.primary, theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, SHADOWS.medium]}
          >
            {!ready ? (
              <View style={styles.heroPlaceholder} />
            ) : nextTrip ? (
              <>
                <ThemedText style={[styles.heroEyebrow, { color: theme.textInverse }]}>Próxima viagem</ThemedText>
                <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]} numberOfLines={2}>
                  {nextTrip.title}
                </ThemedText>
                <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                  {formatDatePtBr(nextTrip.startDate)} — {formatDatePtBr(nextTrip.endDate)}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir viagem ${nextTrip.title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/viagem/[id]",
                      params: { id: nextTrip.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.heroCta,
                    { backgroundColor: theme.textInverse, opacity: pressed ? OPACITY.pressed : 1 },
                  ]}
                >
                  <ThemedText style={[styles.heroCtaLabel, { color: theme.primary }]}>Ver detalhes</ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <ThemedText style={[styles.heroEyebrow, { color: theme.textInverse }]}>Comece por aqui</ThemedText>
                <ThemedText style={[styles.heroTitle, { color: theme.textInverse }]}>Ainda sem viagens</ThemedText>
                <ThemedText style={[styles.heroMeta, { color: theme.textInverse }]}>
                  Cadastre o primeiro roteiro e acompanhe cada dia.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/nova-viagem")}
                  style={({ pressed }) => [
                    styles.heroCta,
                    { backgroundColor: theme.accent, opacity: pressed ? OPACITY.pressed : 1 },
                  ]}
                >
                  <ThemedText style={[styles.heroCtaLabel, { color: theme.textOnAccent }]}>Nova viagem</ThemedText>
                </Pressable>
              </>
            )}
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Em breve
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/viagens")}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedText type="linkPrimary">Ver todas</ThemedText>
            </Pressable>
          </View>

          {!ready ? (
            <View style={styles.listPlaceholder} />
          ) : upcoming.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SymbolView
                name={{ ios: "suitcase", android: "luggage", web: "luggage" }}
                size={28}
                tintColor={theme.secondary}
                weight="medium"
              />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Quando você cadastrar uma viagem, ela aparece aqui.
              </ThemedText>
              <Button label="Cadastrar viagem" onPress={() => router.push("/nova-viagem")} />
            </View>
          ) : (
            <View style={styles.tripList}>
              {upcoming.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onPress={(tripId) =>
                    router.push({
                      pathname: "/viagem/[id]",
                      params: { id: tripId },
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
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
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: BottomTabInset,
    gap: SPACING.lg,
  },
  heroCopy: {
    gap: SPACING.sm,
  },
  greeting: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  headline: {
    letterSpacing: -0.6,
  },
  subcopy: {
    maxWidth: 320,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    minHeight: 188,
    justifyContent: "flex-end",
  },
  heroEyebrow: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    opacity: 0.85,
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
    opacity: 0.9,
    marginBottom: SPACING.sm,
  },
  heroCta: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  heroCtaLabel: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
  tripList: {
    gap: SPACING.md,
  },
  emptyCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    gap: SPACING.md,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  heroPlaceholder: {
    minHeight: 120,
  },
  listPlaceholder: {
    minHeight: 48,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});

