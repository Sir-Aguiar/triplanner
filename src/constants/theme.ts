/**
 * UI/UX Theme — paleta Oxford Navy + Amber
 * #000000 · #14213d · #fca311 · #e5e5e5 · #ffffff
 */

import { Platform } from 'react-native';

export const COLORS = {
  primary: '#14213d',
  secondary: '#000000',
  accent: '#fca311',

  background: '#ffffff',
  surface: '#ffffff',
  atmosphere: '#ffffff',

  textPrimary: '#000000',
  textSecondary: '#14213d',
  textTertiary: '#14213d',
  /** Texto sobre botões primary (navy) */
  textInverse: '#ffffff',
  /** Texto sobre botões accent (âmbar) */
  textOnAccent: '#000000',

  success: '#14213d',
  error: '#000000',
  destructive: '#dc2626',
  warning: '#fca311',
  info: '#14213d',

  border: '#e5e5e5',
} as const;

export const SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 26,
    xxxl: 34,
    display: 40,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 28,
    xxl: 34,
    xxxl: 42,
    display: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

/** Famílias carregadas via expo-font / Google Fonts. */
export const FontFamily = {
  sansRegular: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemibold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  displaySemibold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 9999,
} as const;

export const SHADOWS = {
  light: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 5,
  },
} as const;

export const OPACITY = {
  pressed: 0.72,
  disabled: 0.4,
} as const;

/** Tokens resolvidos por esquema (light/dark) para componentes temáticos. */
export const Colors = {
  light: {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    accent: COLORS.accent,

    background: COLORS.background,
    surface: COLORS.surface,
    surfaceMuted: '#e5e5e5',
    atmosphere: COLORS.atmosphere,

    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    textInverse: COLORS.textInverse,
    textOnAccent: COLORS.textOnAccent,

    success: COLORS.success,
    error: COLORS.error,
    destructive: COLORS.destructive,
    warning: COLORS.warning,
    info: COLORS.info,

    border: COLORS.border,
  },
  dark: {
    primary: '#e5e5e5',
    secondary: '#14213d',
    accent: COLORS.accent,

    background: '#000000',
    surface: '#14213d',
    surfaceMuted: '#14213d',
    atmosphere: '#14213d',

    textPrimary: '#ffffff',
    textSecondary: '#e5e5e5',
    textTertiary: '#e5e5e5',
    textInverse: '#000000',
    textOnAccent: '#000000',

    success: '#e5e5e5',
    error: '#fca311',
    destructive: COLORS.destructive,
    warning: COLORS.accent,
    info: '#e5e5e5',

    border: '#14213d',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** @deprecated Prefer SPACING */
export const Spacing = SPACING;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const BottomTabInset = Platform.select({ ios: 100, android: 108 }) ?? 100;
export const MaxContentWidth = 800;

export const Theme = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  opacity: OPACITY,
};

export default Theme;
