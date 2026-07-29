/**
 * UI/UX Theme — paleta "Maré Suave"
 * Teal profundo, névoa fresca e âmbar de amanhecer — confortável e distinto.
 */

import { Platform } from 'react-native';

export const COLORS = {
  primary: '#1F4E5F',
  secondary: '#5B8FA6',
  accent: '#E09F3E',

  background: '#F0F4F7',
  surface: '#FFFFFF',
  /** Tom suave no topo de telas (gradiente atmosférico). */
  atmosphere: '#DCE8EE',

  textPrimary: '#1A2B34',
  textSecondary: '#5A6F7A',
  textTertiary: '#8A9BA5',
  /** Texto sobre botões primary/accent */
  textInverse: '#FFFFFF',

  success: '#2F9B7A',
  error: '#D64545',
  warning: '#C9922A',
  info: '#4A90B8',

  border: '#D5DEE5',
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
    shadowColor: '#1F4E5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1F4E5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
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
    surfaceMuted: '#E4EBF0',
    atmosphere: COLORS.atmosphere,

    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    textInverse: COLORS.textInverse,

    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,

    border: COLORS.border,
  },
  dark: {
    primary: '#7EB8C9',
    secondary: '#3D6B7A',
    accent: COLORS.accent,

    background: '#0C171C',
    surface: '#152228',
    surfaceMuted: '#1E3340',
    atmosphere: '#122028',

    textPrimary: '#F2F7F9',
    textSecondary: '#9BB0BA',
    textTertiary: '#6F8692',
    textInverse: COLORS.textInverse,

    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,

    border: '#2A4050',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
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
