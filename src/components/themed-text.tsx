import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'display'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'textPrimary'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'display' && styles.display,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  smallBold: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  default: {
    fontFamily: FontFamily.sansMedium,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  title: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: TYPOGRAPHY.sizes.xxxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxxl,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: FontFamily.displayBold,
    fontSize: TYPOGRAPHY.sizes.display,
    lineHeight: TYPOGRAPHY.lineHeights.display,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: TYPOGRAPHY.sizes.xxl,
    lineHeight: TYPOGRAPHY.lineHeights.xxl,
    letterSpacing: -0.3,
  },
  link: {
    fontFamily: FontFamily.sansMedium,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  linkPrimary: {
    fontFamily: FontFamily.sansSemibold,
    lineHeight: TYPOGRAPHY.lineHeights.lg,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: TYPOGRAPHY.weights.bold }) ?? TYPOGRAPHY.weights.medium,
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
});
