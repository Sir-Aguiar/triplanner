import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { FormField, formControlStyles } from '@/components/form/FormField';
import { OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormPasswordInputProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'secureTextEntry'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
};

export function FormPasswordInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  rules,
  style,
  ...textInputProps
}: FormPasswordInputProps<T>) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <FormField label={label} required={required} error={error?.message} hint={hint}>
          <View style={styles.wrap}>
            <TextInput
              ref={ref}
              value={typeof value === 'string' ? value : ''}
              onBlur={onBlur}
              onChangeText={onChange}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              placeholderTextColor={theme.textTertiary}
              style={[
                formControlStyles.control,
                styles.input,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.surface,
                  borderColor: error ? theme.error : theme.border,
                },
                style,
              ]}
              {...textInputProps}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
              hitSlop={SPACING.sm}
              onPress={() => setVisible((current) => !current)}
              style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
              <SymbolView
                name={
                  visible
                    ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                    : { ios: 'eye', android: 'visibility', web: 'visibility' }
                }
                size={TYPOGRAPHY.sizes.lg}
                tintColor={theme.textSecondary}
                weight="regular"
              />
            </Pressable>
          </View>
        </FormField>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    paddingRight: SPACING.xxxl,
  },
  toggle: {
    position: 'absolute',
    right: SPACING.sm,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
