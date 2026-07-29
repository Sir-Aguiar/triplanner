import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Fundo em névoa suave no topo — dá profundidade sem cards genéricos. */
export function AtmosphericBackground() {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[theme.atmosphere, theme.background]}
      locations={[0, 0.55]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
