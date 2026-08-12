import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SPACING } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppHeaderProps = {
  /** `brand` destaca a marca; `plain` usa o fundo padrão. */
  variant?: "brand" | "plain";
};

export function AppHeader({ variant = "brand" }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const backgroundColor = variant === "brand" ? theme.primary : theme.background;

  return (
    <View style={[styles.wrapper, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={[
            styles.logo,
            variant === "brand" && { backgroundColor: "rgba(255,255,255,0.18)" },
          ]}
          contentFit="contain"
          accessibilityLabel="Triplanner"
        />
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
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
});
