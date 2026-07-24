import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BORDER_RADIUS, COLORS, OPACITY, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function DatabaseLoadingScreen({ errorMessage, onRetry }: Props) {
  const theme = useTheme();
  const hasError = Boolean(errorMessage);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {!hasError && <ActivityIndicator size="large" color={theme.primary} />}
        <ThemedText type="subtitle" style={styles.title}>
          {hasError ? 'Não foi possível iniciar' : 'Preparando seu app'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {hasError
            ? errorMessage
            : 'Configurando o banco de dados local. Isso não precisa de internet.'}
        </ThemedText>
        {hasError && onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="default" style={styles.retryLabel}>
              Tentar novamente
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryLabel: {
    color: COLORS.textInverse,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
