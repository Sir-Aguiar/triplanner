import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripCard } from '@/components/trips/trip-card';
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
import { useTrips } from '@/hooks/use-trips';

export default function ViagensScreen() {
  const theme = useTheme();
  const { trips, loading } = useTrips();

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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              trips.length === 0 && styles.listEmpty,
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TripCard
                trip={item}
                onPress={(tripId) =>
                  router.push({
                    pathname: '/viagem/[id]',
                    params: { id: tripId },
                  })
                }
              />
            )}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Nenhuma viagem ainda. Toque em + para cadastrar.
              </ThemedText>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.md,
  },
  emptyText: {
    textAlign: 'center',
  },
});
