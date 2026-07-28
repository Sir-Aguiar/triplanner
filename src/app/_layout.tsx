import { DatabaseProvider } from '@nozbe/watermelondb/react';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  router,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseLoadingScreen } from '@/components/database-loading-screen';
import { ToastProvider } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/contexts/session';
import { getDatabase, initializeDatabase } from '@/database';
import { useClaimOrphanTripsOnSession } from '@/hooks/use-claim-orphan-trips';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

type InitStatus = 'loading' | 'ready' | 'error';

function createNavigationTheme(scheme: 'light' | 'dark'): Theme {
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
  };
}

function RootNavigator() {
  const { isLoggedIn, isLoading: isSessionLoading, hasDismissedWelcome } = useSession();
  const didPresentWelcome = useRef(false);

  useClaimOrphanTripsOnSession();

  useEffect(() => {
    if (isSessionLoading || isLoggedIn || hasDismissedWelcome) {
      if (hasDismissedWelcome || isLoggedIn) {
        didPresentWelcome.current = false;
      }
      return;
    }

    if (didPresentWelcome.current) {
      return;
    }

    didPresentWelcome.current = true;
    router.push('/welcome');
  }, [isSessionLoading, isLoggedIn, hasDismissedWelcome]);

  if (isSessionLoading) {
    return <DatabaseLoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="menu"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="nova-viagem"
        options={{
          headerShown: true,
          title: 'Cadastrar viagem',
        }}
      />
      <Stack.Screen
        name="viagem/[id]"
        options={{
          headerShown: true,
          title: 'Detalhes da viagem',
        }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="entrar"
        options={{
          headerShown: true,
          title: 'Entrar',
        }}
      />
      <Stack.Screen
        name="criar-conta"
        options={{
          headerShown: true,
          title: 'Criar Conta',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const navigationTheme = useMemo(() => createNavigationTheme(scheme), [scheme]);
  const [status, setStatus] = useState<InitStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      await initializeDatabase();
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido ao preparar o banco local.';
      console.error('Falha na inicialização do banco:', error);
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    bootstrap();
  }, [bootstrap]);

  return (
    <ThemeProvider value={navigationTheme}>
      {status !== 'ready' ? (
        <DatabaseLoadingScreen
          errorMessage={status === 'error' ? errorMessage : null}
          onRetry={status === 'error' ? () => void bootstrap() : undefined}
        />
      ) : (
        <DatabaseProvider database={getDatabase()}>
          <SessionProvider>
            <ToastProvider>
              <AnimatedSplashOverlay />
              <RootNavigator />
            </ToastProvider>
          </SessionProvider>
        </DatabaseProvider>
      )}
    </ThemeProvider>
  );
}
