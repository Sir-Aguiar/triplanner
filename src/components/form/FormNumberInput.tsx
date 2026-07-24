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

type NumberMode = 'integer' | 'decimal';

export type FormNumberInputProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'keyboardType'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  /** integer = teclado numérico; decimal = teclado monetário */
  mode?: NumberMode;
  /** Permite campo vazio (grava null). Útil para orçamento opcional. */
  allowEmpty?: boolean;
};

function parseNumber(text: string, mode: NumberMode): number | null {
  const normalized = text.replace(',', '.').trim();
  if (!normalized || normalized === '.' || normalized === '-') {
    return null;
  }

  const parsed = mode === 'integer' ? Number.parseInt(normalized, 10) : Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value);
}

function NumberInputControl<T extends FieldValues>({
  value,
  onChange,
  onBlur,
  inputRef,
  mode,
  allowEmpty,
  error,
  style,
  textInputProps,
}: {
  value: unknown;
  onChange: (value: PathValue<T, FieldPath<T>>) => void;
  onBlur: () => void;
  inputRef: Ref<TextInput>;
  mode: NumberMode;
  allowEmpty: boolean;
  error?: boolean;
  style?: TextInputProps['style'];
  textInputProps: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'keyboardType'>;
}) {
  const theme = useTheme();
  const [text, setText] = useState(() => toDisplay(value));

  useEffect(() => {
    const parsed = parseNumber(text, mode);
    const external = value === null || value === undefined ? null : Number(value);

    if (parsed !== external) {
      setText(toDisplay(value));
    }
  }, [value, mode, text]);

  return (
    <TextInput
      ref={inputRef}
      value={text}
      onBlur={() => {
        const parsed = parseNumber(text, mode);
        if (parsed === null) {
          setText(allowEmpty ? '' : '0');
          onChange((allowEmpty ? null : 0) as PathValue<T, FieldPath<T>>);
        } else {
          setText(String(parsed));
          onChange(parsed as PathValue<T, FieldPath<T>>);
        }
        onBlur();
      }}
      onChangeText={(next) => {
        const sanitized =
          mode === 'integer'
            ? next.replace(/[^\d]/g, '')
            : next.replace(/[^\d.,]/g, '').replace(',', '.');
        setText(sanitized);

        const parsed = parseNumber(sanitized, mode);
        if (parsed === null) {
          onChange((allowEmpty ? null : 0) as PathValue<T, FieldPath<T>>);
          return;
        }
        onChange(parsed as PathValue<T, FieldPath<T>>);
      }}
      keyboardType={mode === 'integer' ? 'number-pad' : 'decimal-pad'}
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

export function FormNumberInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  rules,
  mode = 'integer',
  allowEmpty = false,
  style,
  ...textInputProps
}: FormNumberInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <FormField label={label} required={required} error={error?.message} hint={hint}>
          <NumberInputControl
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            inputRef={ref}
            mode={mode}
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
