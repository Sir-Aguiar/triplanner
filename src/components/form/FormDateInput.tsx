import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type RegisterOptions,
} from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { FormField, formControlStyles } from '@/components/form/FormField';
import { ThemedText } from '@/components/themed-text';
import { OPACITY, SPACING } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDatePtBr, fromUtcIsoDate, toUtcIsoDate } from '@/utils/dates';

export type FormDateInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function FormDateInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  rules,
  placeholder = 'Selecione a data',
  minimumDate,
  maximumDate,
}: FormDateInputProps<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        const isoValue = typeof value === 'string' ? value : '';
        const selectedDate = isoValue ? fromUtcIsoDate(isoValue) : new Date();

        const handleChange = (event: DateTimePickerEvent, date?: Date) => {
          if (Platform.OS === 'android') {
            setOpen(false);
          }

          if (event.type === 'dismissed') {
            onBlur();
            return;
          }

          if (date) {
            onChange(toUtcIsoDate(date) as PathValue<T, FieldPath<T>>);
          }

          onBlur();
        };

        return (
          <FormField label={label} required={required} error={error?.message} hint={hint}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(true)}
              style={({ pressed }) => [
                formControlStyles.control,
                styles.trigger,
                {
                  backgroundColor: theme.surface,
                  borderColor: error ? theme.error : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText themeColor={isoValue ? 'textPrimary' : 'textTertiary'}>
                {isoValue ? formatDatePtBr(isoValue) : placeholder}
              </ThemedText>
            </Pressable>

            {open ? (
              <View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  locale="pt-BR"
                />
                {Platform.OS === 'ios' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setOpen(false);
                      onBlur();
                    }}
                    style={styles.iosDone}>
                    <ThemedText themeColor="primary" type="smallBold">
                      Concluir
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </FormField>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  trigger: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
  iosDone: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
});
