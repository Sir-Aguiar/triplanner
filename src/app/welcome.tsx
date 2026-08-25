import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AtmosphericBackground } from "@/components/atmospheric-background";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { FontFamily, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useSession } from "@/contexts/session";

export default function WelcomeModal() {
  const { continueAsGuest } = useSession();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <AtmosphericBackground />
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, SPACING.xl) + SPACING.xl,
            paddingBottom: Math.max(insets.bottom, SPACING.lg),
          },
        ]}
      >
        <View style={styles.copy}>
          <ThemedText type="display" style={styles.brand}>
            triplanner
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.blurb}>
            Planeje roteiros com calma: datas, orçamento e cada belo momento no mesmo lugar.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Button label="Continuar como Convidado" onPress={continueAsGuest} />
          <Button label="Entrar" variant="secondary" onPress={() => router.push("/entrar")} />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/criar-conta")}
            style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}
          >
            <ThemedText type="linkPrimary">Criar Conta</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  copy: {
    gap: SPACING.md,
    paddingTop: SPACING.xxl,
  },
  brand: {
    fontFamily: FontFamily.displaySemibold,
    letterSpacing: -0.6,
  },
  blurb: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    maxWidth: 320,
  },
  actions: {
    gap: SPACING.md,
  },
  linkWrap: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  linkPressed: {
    opacity: 0.7,
  },
});
