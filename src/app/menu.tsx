import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PROFILE_BLURB = 'Planeje suas viagens com facilidade e organize cada belo momento.';
const SLIDE_MS = 280;

export default function MenuScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = width;
    translateX.value = withTiming(0, {
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateX, width]);

  const finishDismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, []);

  const dismiss = useCallback(() => {
    translateX.value = withTiming(
      width,
      {
        duration: SLIDE_MS,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishDismiss)();
        }
      },
    );
  }, [finishDismiss, translateX, width]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.panel, { backgroundColor: theme.background }, panelStyle]}>
        <AppHeader variant="plain" action="back" onBackPress={dismiss} />

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.cardBanner, { backgroundColor: theme.primary }]} />
            <View style={styles.cardBody}>
              <ThemedText themeColor="textSecondary" style={styles.blurb}>
                {PROFILE_BLURB}
              </ThemedText>
              <Button label="Fazer Login" onPress={() => router.push('/entrar')} />
              <Button
                label="Criar Conta"
                variant="secondary"
                onPress={() => router.push('/criar-conta')}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  panel: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  cardBanner: {
    height: 96,
  },
  cardBody: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  blurb: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
});
