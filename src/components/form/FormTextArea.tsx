import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { TextInput, type TextInputProps } from 'react-native';

import { FormField, formControlStyles } from '@/components/form/FormField';
import { useTheme } from '@/hooks/use-theme';

export type FormTextAreaProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'multiline'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  minHeight?: number;
};

export function FormTextArea<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  rules,
  style,
  minHeight = 112,
  ...textInputProps
}: FormTextAreaProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <FormField label={label} required={required} error={error?.message} hint={hint}>
          <TextInput
            ref={ref}
            value={typeof value === 'string' ? value : ''}
            onBlur={onBlur}
            onChangeText={onChange}
            multiline
            textAlignVertical="top"
            placeholderTextColor={theme.textTertiary}
            style={[
              formControlStyles.control,
              {
                minHeight,
                color: theme.textPrimary,
                backgroundColor: theme.surface,
                borderColor: error ? theme.error : theme.border,
              },
              style,
            ]}
            {...textInputProps}
          />
        </FormField>
      )}
    />
  );
}
