import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BORDER_RADIUS, SPACING } from '@/constants/theme';
import { useSession } from '@/contexts/session';

export default function WelcomeModal() {
  const { continueAsGuest } = useSession();
  const insets = useSafeAreaInsets();

  const dismissAsGuest = () => {
    continueAsGuest();
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ThemedView type="surface" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
      <View style={styles.actions}>
        <Button label="Continuar como Convidado" onPress={dismissAsGuest} />
        <Button label="Entrar" variant="secondary" onPress={() => router.push('/entrar')} />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/criar-conta')}
          style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}>
          <ThemedText type="linkPrimary">Criar Conta</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  actions: {
    gap: SPACING.md,
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  linkPressed: {
    opacity: 0.7,
  },
});
