import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type RegisterOptions,
} from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/FormField';
import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CategoryOption = {
  id: string;
  name: string;
  color?: string | null;
};

export type FormCategorySelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: CategoryOption[];
  required?: boolean;
  hint?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
};

export function FormCategorySelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  hint,
  rules,
}: FormCategorySelectProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormField label={label} required={required} error={error?.message} hint={hint}>
          <View style={styles.list}>
            {options.map((option) => {
              const selected = value === option.id;
              const accent = option.color || theme.primary;

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(option.id as PathValue<T, FieldPath<T>>)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: selected ? accent : theme.border,
                      backgroundColor: selected ? `${accent}1F` : theme.surface,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.dot, { backgroundColor: accent }]} />
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.chipLabel,
                      { color: selected ? theme.textPrimary : theme.textSecondary },
                    ]}>
                    {option.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </FormField>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.sm,
  },
  chip: {
    width: '48.5%',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.pill,
    flexShrink: 0,
  },
  chipLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
