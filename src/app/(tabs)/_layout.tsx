import { StyleSheet, View } from 'react-native';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';

import { AppHeader } from '@/components/app-header';
import { FloatingTabBar } from '@/components/floating-tab-bar';
import { renderSlidingTab, TabTransitionProvider } from '@/components/sliding-tab-slot';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader />
      <TabTransitionProvider>
        <Tabs
          style={styles.tabs}
          options={{
            screenOptions: {
              freezeOnBlur: true,
            },
          }}
        >
          <TabSlot style={styles.slot} renderFn={renderSlidingTab} />
          <FloatingTabBar />
          <TabList style={styles.hiddenList}>
            <TabTrigger name="index" href="/(tabs)" />
            <TabTrigger name="viagens" href="/(tabs)/viagens" />
            <TabTrigger name="perfil" href="/(tabs)/perfil" />
          </TabList>
        </Tabs>
      </TabTransitionProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  hiddenList: {
    display: 'none',
  },
});
