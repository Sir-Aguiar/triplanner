import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, OPACITY, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppHeaderProps = {
  /** `brand` destaca a marca; `plain` usa o fundo padrão. */
  variant?: "brand" | "plain";
  /** Ação à direita: menu abre `/menu`; back volta. */
  action?: "menu" | "back";
  /** Substitui o comportamento padrão do botão voltar. */
  onBackPress?: () => void;
};

export function AppHeader({ variant = "brand", action = "menu", onBackPress }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const backgroundColor = variant === "brand" ? theme.primary : theme.background;
  const iconColor = variant === "brand" ? theme.textInverse : theme.textPrimary;
  const brandColor = variant === "brand" ? theme.textInverse : theme.textPrimary;

  const onActionPress = () => {
    if (action === "back") {
      if (onBackPress) {
        onBackPress();
        return;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
      return;
    }
    router.push("/menu");
  };

  return (
    <View style={[styles.wrapper, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.brandRow}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={[
              styles.logo,
              variant === "brand" && { backgroundColor: "rgba(255,255,255,0.18)" },
            ]}
            contentFit="contain"
            accessibilityLabel="Triplanner"
          />
          <ThemedText style={[styles.brandName, { color: brandColor }]}>triplanner</ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action === "back" ? "Voltar" : "Abrir menu"}
          hitSlop={SPACING.md}
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.actionButton,
            variant === "brand" && styles.actionButtonBrand,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={
              action === "back"
                ? { ios: "xmark", android: "close", web: "close" }
                : { ios: "line.3.horizontal", android: "menu", web: "menu" }
            }
            size={TYPOGRAPHY.sizes.xl}
            tintColor={iconColor}
            weight="medium"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  bar: {
    minHeight: 60,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  brandName: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: TYPOGRAPHY.sizes.lg,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
    letterSpacing: -0.4,
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  actionButtonBrand: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
