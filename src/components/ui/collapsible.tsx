import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        SHADOWS.light,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <View style={[styles.button, { backgroundColor: theme.atmosphere }]}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={TYPOGRAPHY.sizes.sm}
            weight="bold"
            tintColor={theme.primary}
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
          />
        </View>

        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pressedHeading: {
    opacity: OPACITY.pressed,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  content: {
    paddingLeft: SPACING.lg + SPACING.sm,
    paddingBottom: SPACING.xs,
  },
});
