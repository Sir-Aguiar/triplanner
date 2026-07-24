import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormFieldProps = ViewProps & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Texto exibido no tooltip ao tocar no ícone de informação. */
  tooltip?: string;
  labelAccessory?: ReactNode;
};

export function FormField({
  label,
  required = false,
  error,
  hint,
  tooltip,
  labelAccessory,
  children,
  style,
  ...rest
}: FormFieldProps) {
  const theme = useTheme();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>
          {label}
          {required ? <ThemedText style={{ color: theme.error }}> *</ThemedText> : null}
        </ThemedText>

        {tooltip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Informação sobre ${label}`}
            hitSlop={SPACING.sm}
            onPress={() => setTooltipOpen(true)}
            style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info', web: 'info' }}
              size={TYPOGRAPHY.sizes.md}
              tintColor={theme.textSecondary}
              weight="regular"
            />
          </Pressable>
        ) : null}

        {labelAccessory}
      </View>

      {children}

      {error ? (
        <ThemedText style={[styles.helper, { color: theme.error }]}>{error}</ThemedText>
      ) : hint ? (
        <ThemedText themeColor="textTertiary" style={styles.helper}>
          {hint}
        </ThemedText>
      ) : null}

      {tooltip ? (
        <Modal
          animationType="fade"
          transparent
          visible={tooltipOpen}
          onRequestClose={() => setTooltipOpen(false)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar informação"
            onPress={() => setTooltipOpen(false)}
            style={styles.tooltipBackdrop}>
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.tooltipCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.tooltipTitle}>
                {label}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tooltipBody}>
                {tooltip}
              </ThemedText>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

export const formControlStyles = StyleSheet.create({
  control: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
});

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  infoButton: {
    padding: SPACING.xs / 2,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
  helper: {
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.xs,
  },
  tooltipBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  tooltipCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  tooltipTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  tooltipBody: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
});
