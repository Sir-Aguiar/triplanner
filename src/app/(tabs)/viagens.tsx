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

import { AtmosphericBackground } from '@/components/atmospheric-background';
import { TripCard } from '@/components/trips/trip-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BORDER_RADIUS,
  BottomTabInset,
  OPACITY,
  SHADOWS,
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
      <AtmosphericBackground />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <ThemedText type="subtitle">Viagens</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {trips.length === 0
                ? 'Seus roteiros ficam aqui'
                : `${trips.length} ${trips.length === 1 ? 'roteiro' : 'roteiros'}`}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cadastrar viagem"
            hitSlop={SPACING.md}
            onPress={() => router.push('/nova-viagem')}
            style={({ pressed }) => [
              styles.addButton,
              SHADOWS.light,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add' }}
              size={TYPOGRAPHY.sizes.xl}
              tintColor={theme.textInverse}
              weight="medium"
            />
          </Pressable>
        </View>

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
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <SymbolView
                  name={{ ios: 'map', android: 'map', web: 'map' }}
                  size={32}
                  tintColor={theme.secondary}
                  weight="medium"
                />
                <ThemedText type="smallBold" style={styles.emptyTitle}>
                  Nenhuma viagem ainda
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Toque no + para criar seu primeiro roteiro com datas, orçamento e atividades.
                </ThemedText>
              </View>
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerCopy: {
    gap: SPACING.xs,
    flex: 1,
    paddingRight: SPACING.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
    transform: [{ scale: 0.96 }],
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
  emptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
});
