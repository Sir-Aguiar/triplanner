import { SymbolView } from "expo-symbols";
import { TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BORDER_RADIUS, FontFamily, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Altura visual da pill + margem inferior (sem safe area). */
export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_MARGIN = SPACING.md;

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: {
    ios: "house.fill" | "suitcase" | "person.fill";
    android: "home" | "luggage" | "person";
    web: "home" | "luggage" | "person";
  };
};

function TabBarButton({ label, icon, isFocused, style, ...props }: TabBarButtonProps) {
  const theme = useTheme();
  const iconColor = isFocused ? theme.textOnAccent : theme.textSecondary;

  return (
    <Pressable
      {...props}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        styles.item,
        isFocused && { backgroundColor: theme.accent },
        state.pressed && styles.pressed,
      ]}
    >
      <SymbolView name={icon} size={TYPOGRAPHY.sizes.lg} tintColor={iconColor} weight="medium" />
      <ThemedText style={[styles.label, { color: isFocused ? theme.textOnAccent : theme.textSecondary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FloatingTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View
        pointerEvents="box-none"
        style={[styles.anchor, { bottom: Math.max(insets.bottom, SPACING.sm) + FLOATING_TAB_BAR_MARGIN }]}
      >
        <View
          style={[
            styles.pill,
            SHADOWS.medium,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TabTrigger name="index" asChild>
            <TabBarButton label="Início" icon={{ ios: "house.fill", android: "home", web: "home" }} />
          </TabTrigger>
          <TabTrigger name="viagens" asChild>
            <TabBarButton label="Viagens" icon={{ ios: "suitcase", android: "luggage", web: "luggage" }} />
          </TabTrigger>
          <TabTrigger name="perfil" asChild>
            <TabBarButton label="Perfil" icon={{ ios: "person.fill", android: "person", web: "person" }} />
          </TabTrigger>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
  },
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xl,
    minHeight: FLOATING_TAB_BAR_HEIGHT,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flexDirection: "column",
    minWidth: 76,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});

