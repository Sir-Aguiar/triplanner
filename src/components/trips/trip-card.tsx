import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { TripListItem } from "@/hooks/use-trips";
import { BORDER_RADIUS, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { resolveCoverImageUri } from "@/utils/cover-image";
import { formatCurrencyBrl } from "@/utils/currency";
import { formatTripPeriod } from "@/utils/dates";

type TripCardAuthor = {
  name: string;
  username: string;
};

type TripCardProps = {
  trip: TripListItem;
  onPress?: (tripId: string) => void;
  /** Quando informado, exibe o ícone de clonar (feed público ou viagens próprias). */
  onClone?: (tripId: string) => void;
  /** Autor no feed social (exibe nome / @username). */
  author?: TripCardAuthor;
  /** Meta extra sob o período (ex.: "7 dias · 12 atividades"). */
  meta?: string;
  /** Esconde o badge pública/privada (útil no feed, onde tudo é público). */
  hideVisibilityBadge?: boolean;
};

export function TripCard({
  trip,
  onPress,
  onClone,
  author,
  meta,
  hideVisibilityBadge = false,
}: TripCardProps) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const coverUri = resolveCoverImageUri(trip.coverImage);

  useEffect(() => {
    setImageFailed(false);
  }, [trip.coverImage]);

  const showCover = Boolean(coverUri) && !imageFailed;
  const visibilityLabel = trip.isPublic ? "Pública" : "Privada";
  const authorLabel = author
    ? author.name.trim() || `@${author.username}`
    : null;

  const cardStyle = [
    styles.card,
    SHADOWS.light,
    {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
  ];

  const content = (
    <>
      <View style={[styles.cover, { backgroundColor: theme.surfaceMuted }]}>
        {showCover && coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
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

        {onClone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clonar viagem ${trip.title}`}
            hitSlop={SPACING.sm}
            onPress={() => onClone(trip.id)}
            style={({ pressed }) => [
              styles.cloneButton,
              { backgroundColor: theme.surface },
              pressed && styles.clonePressed,
            ]}
          >
            <SymbolView
              name={{ ios: "doc.on.doc", android: "content_copy", web: "content_copy" }}
              size={16}
              tintColor={theme.textSecondary}
              weight="medium"
            />
          </Pressable>
        ) : null}

        {!hideVisibilityBadge ? (
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
        ) : null}
      </View>

      <View style={styles.body}>
        {author ? (
          <ThemedText themeColor="textSecondary" type="small" numberOfLines={1}>
            {author.name.trim() ? author.name : null}
            {author.name.trim() && author.username ? " · " : null}
            {author.username ? `@${author.username}` : null}
          </ThemedText>
        ) : null}

        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {trip.title}
        </ThemedText>

        <ThemedText themeColor="textSecondary" type="small">
          {formatTripPeriod(trip.startDate, trip.endDate)}
        </ThemedText>

        {meta ? (
          <ThemedText themeColor="textSecondary" type="small">
            {meta}
          </ThemedText>
        ) : null}

        <ThemedText themeColor="textSecondary" type="smallBold" style={styles.budget}>
          {trip.totalBudget > 0 ? formatCurrencyBrl(trip.totalBudget) : "Sem orçamento"}
        </ThemedText>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={cardStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        authorLabel
          ? `Roteiro ${trip.title} por ${authorLabel}`
          : `Abrir viagem ${trip.title}, ${visibilityLabel}`
      }
      onPress={() => onPress(trip.id)}
      style={({ pressed }) => [
        ...cardStyle,
        {
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? OPACITY.pressed : 1,
        },
      ]}
    >
      {content}
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
  cloneButton: {
    position: "absolute",
    top: SPACING.sm,
    left: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },
  clonePressed: {
    opacity: OPACITY.pressed,
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
