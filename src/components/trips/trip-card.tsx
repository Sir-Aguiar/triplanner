import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { TripListItem } from "@/hooks/use-trips";
import { BORDER_RADIUS, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatCurrencyBrl } from "@/utils/currency";
import { formatTripPeriod } from "@/utils/dates";

type TripCardProps = {
  trip: TripListItem;
  onPress: (tripId: string) => void;
};

function isRenderableCoverUri(coverImage: string): boolean {
  const value = coverImage.trim();
  if (!value || value === "placeholder") {
    return false;
  }

  return (
    value.startsWith("http://") || value.startsWith("https://") || value.startsWith("file:") || value.startsWith("/")
  );
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [trip.coverImage]);

  const showCover = isRenderableCoverUri(trip.coverImage) && !imageFailed;
  const visibilityLabel = trip.isPublic ? "Pública" : "Privada";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir viagem ${trip.title}, ${visibilityLabel}`}
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
      ]}
    >
      <View style={[styles.cover, { backgroundColor: theme.surfaceMuted }]}>
        {showCover ? (
          <Image
            source={{ uri: trip.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <SymbolView
              name={{ ios: "photo", android: "image", web: "image" }}
              size={28}
              tintColor={theme.textTertiary}
              weight="medium"
            />
          </View>
        )}

        <View accessibilityLabel={visibilityLabel} style={[styles.visibilityBadge, { backgroundColor: theme.surface }]}>
          <SymbolView
            name={
              trip.isPublic
                ? { ios: "globe", android: "public", web: "public" }
                : { ios: "lock.fill", android: "lock", web: "lock" }
            }
            size={14}
            tintColor={theme.textSecondary}
            weight="medium"
          />
        </View>
      </View>

      <View style={styles.body}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {trip.title}
        </ThemedText>

        <ThemedText themeColor="textSecondary" type="small">
          {formatTripPeriod(trip.startDate, trip.endDate)}
        </ThemedText>

        <ThemedText themeColor="textSecondary" type="smallBold" style={styles.budget}>
          {trip.totalBudget > 0 ? formatCurrencyBrl(trip.totalBudget) : "Sem orçamento"}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  cover: {
    height: 128,
    width: "100%",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityBadge: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },
  body: {
    padding: SPACING.md + 2,
    gap: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
  },
  budget: {
    marginTop: SPACING.xs,
  },
});

