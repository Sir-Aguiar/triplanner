import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { Switch, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/FormField';
import { ThemedText } from '@/components/themed-text';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormSwitchProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  description?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
};

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  description,
  rules,
}: FormSwitchProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormField label={label} required={required} error={error?.message} hint={hint}>
          <View style={styles.row}>
            {description ? (
              <ThemedText themeColor="textSecondary" style={styles.description}>
                {description}
              </ThemedText>
            ) : (
              <View style={styles.spacer} />
            )}
            <Switch
              value={Boolean(value)}
              onValueChange={onChange}
              trackColor={{ false: theme.border, true: theme.secondary }}
              thumbColor={value ? theme.primary : theme.surface}
            />
          </View>
        </FormField>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  description: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  spacer: {
    flex: 1,
  },
});
