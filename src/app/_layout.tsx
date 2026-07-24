import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseLoadingScreen } from '@/components/database-loading-screen';
import { Colors } from '@/constants/theme';
import { getDatabase, initializeDatabase } from '@/database';

SplashScreen.preventAutoHideAsync();

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
      // RN01: inicialização 100% local — sem rede e sem login.
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
    // Troca a splash nativa pela tela de loading enquanto o banco inicializa.
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
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="nova-viagem"
              options={{
                headerShown: true,
                title: 'Cadastrar viagem',
              }}
            />
          </Stack>
        </DatabaseProvider>
      )}
    </ThemeProvider>
  );
}
