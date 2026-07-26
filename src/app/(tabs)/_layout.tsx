import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AppHeader } from '@/components/app-header';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader />
      <View style={styles.tabs}>
        <AppTabs />
      </View>
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
});
