import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  BORDER_RADIUS,
  BottomTabInset,
  FontFamily,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useSession } from '@/contexts/session';
import { useTheme } from '@/hooks/use-theme';
import { syncService } from '@/services';

const PROFILE_BLURB = 'Planeje suas viagens com facilidade e organize cada belo momento.';

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

export default function PerfilScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, user, signOut } = useSession();
  const { showToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: BottomTabInset + Math.max(insets.bottom, SPACING.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, SHADOWS.medium, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBanner}
          />

          {isLoggedIn ? (
            <View style={styles.cardBody}>
              {user ? (
                <>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.accent, borderColor: theme.surface },
                    ]}>
                    <ThemedText style={[styles.avatarLabel, { color: theme.textOnAccent }]}>
                      {getInitials(user.name)}
                    </ThemedText>
                  </View>

                  <View style={styles.profileCopy}>
                    <ThemedText type="subtitle" style={styles.profileName} numberOfLines={2}>
                      {user.name}
                    </ThemedText>
                    <ThemedText themeColor="primary" style={styles.profileUsername} numberOfLines={1}>
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
              <ThemedText type="subtitle" style={styles.guestBrand}>
                Sua conta
              </ThemedText>
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardBanner: {
    height: 112,
  },
  cardBody: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: -SPACING.xxxl - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    alignSelf: 'center',
  },
  avatarLabel: {
    fontFamily: FontFamily.sansBold,
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
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
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  profileEmail: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    textAlign: 'center',
  },
  guestBrand: {
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  blurb: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: SPACING.md,
  },
});
