import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useSession } from '@/contexts/session';
import { useTheme } from '@/hooks/use-theme';
import { syncService } from '@/services';

const PROFILE_BLURB = 'Planeje suas viagens com facilidade e organize cada belo momento.';
const SLIDE_MS = 280;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export default function MenuScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isLoggedIn, user, signOut } = useSession();
  const { showToast } = useToast();
  const translateX = useSharedValue(width);
  const [signingOut, setSigningOut] = useState(false);

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

  const finishSignOut = useCallback(() => {
    signOut();
    showToast('Você saiu da conta.');
  }, [showToast, signOut]);

  const handleSignOut = useCallback(() => {
    if (signingOut) {
      return;
    }

    Alert.alert(
      'Sair da conta',
      'Deseja manter seus roteiros salvos neste dispositivo para uso offline ou apagar tudo por privacidade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Manter Dados',
          onPress: () => {
            void (async () => {
              setSigningOut(true);
              try {
                if (user?.userId) {
                  await syncService.orphanLocalTrips(user.userId);
                }
                finishSignOut();
              } catch (error) {
                console.error('Falha ao manter dados no logoff:', error);
                showToast('Não foi possível concluir a saída.');
              } finally {
                setSigningOut(false);
              }
            })();
          },
        },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSigningOut(true);
              try {
                await syncService.clearLocalTripData();
                finishSignOut();
              } catch (error) {
                console.error('Falha ao apagar dados no logoff:', error);
                showToast('Não foi possível apagar os dados locais.');
              } finally {
                setSigningOut(false);
              }
            })();
          },
        },
      ],
    );
  }, [finishSignOut, showToast, signingOut, user?.userId]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.panel, { backgroundColor: theme.background }, panelStyle]}>
        <AppHeader variant="plain" action="back" onBackPress={dismiss} />

        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.cardBanner, { backgroundColor: theme.primary }]} />

            {isLoggedIn ? (
              <View style={styles.cardBody}>
                {user ? (
                  <>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.secondary, borderColor: theme.surface },
                      ]}>
                      <ThemedText style={[styles.avatarLabel, { color: theme.textInverse }]}>
                        {getInitials(user.name)}
                      </ThemedText>
                    </View>

                    <View style={styles.profileCopy}>
                      <ThemedText type="subtitle" style={styles.profileName} numberOfLines={2}>
                        {user.name}
                      </ThemedText>
                      <ThemedText
                        themeColor="primary"
                        style={styles.profileUsername}
                        numberOfLines={1}>
                        @{user.username}
                      </ThemedText>
                      <ThemedText
                        themeColor="textSecondary"
                        style={styles.profileEmail}
                        numberOfLines={1}>
                        {user.email}
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <ThemedText themeColor="textSecondary" style={styles.blurb}>
                    Você está conectado.
                  </ThemedText>
                )}
              </View>
            ) : (
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
            )}
          </View>

          {isLoggedIn ? (
            <View style={styles.footer}>
              <Button
                label="Sair da conta"
                variant="secondary"
                onPress={handleSignOut}
                disabled={signingOut}
              />
            </View>
          ) : null}
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
    justifyContent: 'space-between',
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: -SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    alignSelf: 'center',
  },
  avatarLabel: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileCopy: {
    alignItems: 'center',
    gap: SPACING.xs,
    width: '100%',
  },
  profileName: {
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    textAlign: 'center',
  },
  blurb: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  footer: {
    paddingTop: SPACING.lg,
  },
});
