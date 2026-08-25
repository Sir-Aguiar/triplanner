import { Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { DefaultTheme, Stack, ThemeProvider, type Theme } from "expo-router";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { DatabaseLoadingScreen } from "@/components/database-loading-screen";
import { ToastProvider } from "@/components/ui/toast";
import { Colors } from "@/constants/theme";
import { SessionProvider, useSession } from "@/contexts/session";
import { getDatabase, initializeDatabase } from "@/database";
import { useBackgroundSync } from "@/hooks/use-background-sync";
import { useColorScheme } from "@/hooks/use-color-scheme";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

type InitStatus = "loading" | "ready" | "error";

function createNavigationTheme(scheme: "light" | "dark"): Theme {
  const colors = Colors[scheme];
  const base = DefaultTheme;

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

function AuthGateStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen
        name="entrar"
        options={{
          headerShown: true,
          title: "Entrar",
        }}
      />
      <Stack.Screen
        name="criar-conta"
        options={{
          headerShown: true,
          title: "Criar Conta",
        }}
      />
    </Stack>
  );
}

function AppStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="nova-viagem"
        options={{
          headerShown: true,
          title: "Cadastrar viagem",
        }}
      />
      <Stack.Screen
        name="viagem/[id]"
        options={{
          headerShown: true,
          title: "Detalhes da viagem",
        }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
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
          title: "Entrar",
        }}
      />
      <Stack.Screen
        name="criar-conta"
        options={{
          headerShown: true,
          title: "Criar Conta",
        }}
      />
    </Stack>
  );
}

function RootNavigator() {
  const { isLoggedIn, isLoading: isSessionLoading, hasDismissedWelcome } = useSession();
  const { isSyncingOnOpen } = useBackgroundSync();
  const canEnterApp = isLoggedIn || hasDismissedWelcome;

  if (isSessionLoading) {
    return <DatabaseLoadingScreen />;
  }

  if (!canEnterApp) {
    return <AuthGateStack />;
  }

  return (
    <View style={styles.navigatorRoot}>
      <AppStack />
      {isSyncingOnOpen ? (
        <View style={styles.syncOverlay} pointerEvents="auto">
          <DatabaseLoadingScreen
            title="Sincronizando"
            subtitle="Atualizando suas viagens com o servidor. Aguarde um momento."
          />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const navigationTheme = useMemo(() => createNavigationTheme(scheme), [scheme]);
  const [status, setStatus] = useState<InitStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      await initializeDatabase();
      setStatus("ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao preparar o banco local.";
      console.error("Falha na inicialização do banco:", error);
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    bootstrap();
  }, [bootstrap]);

  const appReady = status === "ready" && (fontsLoaded || Boolean(fontError));

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {!appReady ? (
        <DatabaseLoadingScreen
          errorMessage={status === "error" ? errorMessage : null}
          onRetry={status === "error" ? () => void bootstrap() : undefined}
        />
      ) : (
        <DatabaseProvider database={getDatabase()}>
          <SessionProvider>
            <ToastProvider>
              <RootNavigator />
              <AnimatedSplashOverlay />
            </ToastProvider>
          </SessionProvider>
        </DatabaseProvider>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  navigatorRoot: {
    flex: 1,
  },
  syncOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
});

