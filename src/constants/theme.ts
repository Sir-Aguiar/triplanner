/**
 * UI/UX Theme — paleta "Horizonte de Viagem"
 * Minimalista, harmonioso e confortável para leitura.
 */

import { Platform } from 'react-native';

export const COLORS = {
  primary: '#2B5B84',
  secondary: '#5FA8D3',
  accent: '#F2A65A',

  background: '#F7F9FC',
  surface: '#FFFFFF',

  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  /** Texto sobre botões primary/accent */
  textInverse: '#FFFFFF',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  border: '#E2E8F0',
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
    xxl: 24,
    xxxl: 32,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 28,
    xxl: 32,
    xxxl: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const SHADOWS = {
  light: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const OPACITY = {
  pressed: 0.7,
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
    surfaceMuted: COLORS.border,

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
    primary: COLORS.secondary,
    secondary: COLORS.primary,
    accent: COLORS.accent,

    background: '#0F172A',
    surface: '#1E293B',
    surfaceMuted: '#334155',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: COLORS.textInverse,

    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning,
    info: COLORS.info,

    border: '#334155',
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
