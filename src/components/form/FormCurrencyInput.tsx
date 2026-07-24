import { useEffect, useState, type Ref } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type RegisterOptions,
} from 'react-hook-form';
import { TextInput, type TextInputProps } from 'react-native';

import { FormField, formControlStyles } from '@/components/form/FormField';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrencyBrl, parseCurrencyBrl } from '@/utils/currency';

export type FormCurrencyInputProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'keyboardType'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  tooltip?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  /** Permite campo vazio (grava null). */
  allowEmpty?: boolean;
};

function CurrencyInputControl<T extends FieldValues>({
  value,
  onChange,
  onBlur,
  inputRef,
  allowEmpty,
  error,
  style,
  textInputProps,
}: {
  value: unknown;
  onChange: (value: PathValue<T, FieldPath<T>>) => void;
  onBlur: () => void;
  inputRef: Ref<TextInput>;
  allowEmpty: boolean;
  error?: boolean;
  style?: TextInputProps['style'];
  textInputProps: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'keyboardType'>;
}) {
  const theme = useTheme();
  const numericValue =
    value === null || value === undefined || value === '' ? null : Number(value);
  const [text, setText] = useState(() => formatCurrencyBrl(numericValue));

  useEffect(() => {
    const external =
      value === null || value === undefined || value === '' ? null : Number(value);
    const parsed = parseCurrencyBrl(text);

    if (parsed !== external) {
      setText(formatCurrencyBrl(external));
    }
  }, [value, text]);

  return (
    <TextInput
      ref={inputRef}
      value={text}
      onBlur={() => {
        const parsed = parseCurrencyBrl(text);
        if (parsed === null) {
          setText(allowEmpty ? '' : formatCurrencyBrl(0));
          onChange((allowEmpty ? null : 0) as PathValue<T, FieldPath<T>>);
        } else {
          setText(formatCurrencyBrl(parsed));
          onChange(parsed as PathValue<T, FieldPath<T>>);
        }
        onBlur();
      }}
      onChangeText={(next) => {
        const parsed = parseCurrencyBrl(next);
        if (parsed === null) {
          setText('');
          onChange((allowEmpty ? null : 0) as PathValue<T, FieldPath<T>>);
          return;
        }

        setText(formatCurrencyBrl(parsed));
        onChange(parsed as PathValue<T, FieldPath<T>>);
      }}
      keyboardType="number-pad"
      placeholderTextColor={theme.textTertiary}
      style={[
        formControlStyles.control,
        {
          color: theme.textPrimary,
          backgroundColor: theme.surface,
          borderColor: error ? theme.error : theme.border,
        },
        style,
      ]}
      {...textInputProps}
    />
  );
}

export function FormCurrencyInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  tooltip,
  rules,
  allowEmpty = true,
  style,
  ...textInputProps
}: FormCurrencyInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <FormField
          label={label}
          required={required}
          error={error?.message}
          hint={hint}
          tooltip={tooltip}>
          <CurrencyInputControl
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            inputRef={ref}
            allowEmpty={allowEmpty}
            error={Boolean(error)}
            style={style}
            textInputProps={textInputProps}
          />
        </FormField>
      )}
    />
  );
}
