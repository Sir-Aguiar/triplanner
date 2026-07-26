import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OPACITY, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppHeaderProps = {
  /** `brand` usa a cor primária; `plain` usa o fundo padrão. */
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
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Triplanner"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action === "back" ? "Voltar" : "Abrir menu"}
          hitSlop={SPACING.md}
          onPress={onActionPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <SymbolView
            name={
              action === "back"
                ? { ios: "xmark", android: "close", web: "xmark" }
                : { ios: "line.3.horizontal", android: "menu", web: "line.3.horizontal" }
            }
            size={TYPOGRAPHY.sizes.xxl}
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
    minHeight: 56,
    paddingLeft: 0,
    paddingRight: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginLeft: SPACING.lg,
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});

