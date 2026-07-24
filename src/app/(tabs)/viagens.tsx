import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BORDER_RADIUS,
  BottomTabInset,
  COLORS,
  OPACITY,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ViagensScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Viagens</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cadastrar viagem"
            hitSlop={SPACING.md}
            onPress={() => router.push('/nova-viagem')}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add' }}
              size={TYPOGRAPHY.sizes.xl}
              tintColor={COLORS.textInverse}
              weight="medium"
            />
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Nenhuma viagem ainda. Toque em + para cadastrar.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingBottom: BottomTabInset,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  addButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
