import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, FontFamily, OPACITY, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'accent'
        ? theme.accent
        : variant === 'secondary'
          ? theme.surface
          : 'transparent';
  const textColor =
    variant === 'primary'
      ? theme.textInverse
      : variant === 'accent'
        ? theme.textOnAccent
        : variant === 'secondary'
          ? theme.textPrimary
          : theme.primary;
  const borderColor = variant === 'secondary' ? theme.border : 'transparent';
  const elevation = variant === 'primary' || variant === 'accent' ? SHADOWS.light : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        elevation,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? OPACITY.disabled : pressed ? OPACITY.pressed : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={[styles.label, { color: textColor }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    overflow: 'hidden',
  },
  label: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    textAlign: 'center',
    width: '100%',
  },
});
