import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type RegisterOptions,
} from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { FormField, formControlStyles } from '@/components/form/FormField';
import { ThemedText } from '@/components/themed-text';
import { COUNTRIES, type CountryOption } from '@/constants/countries';
import { BORDER_RADIUS, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormCountryAutocompleteProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: CountryOption[];
  rules?: RegisterOptions<T, FieldPath<T>>;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterCountries(options: CountryOption[], inputValue: string, focused: boolean): CountryOption[] {
  const needle = normalize(inputValue);
  if (!needle) {
    return focused ? options : [];
  }

  return options.filter((option) => normalize(option.name).includes(needle));
}

export function FormCountryAutocomplete<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  placeholder = 'Digite o país',
  options = COUNTRIES,
  rules,
}: FormCountryAutocompleteProps<T>) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState<string | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => {
        const selected = typeof value === 'string' ? value : '';
        const inputValue = query ?? selected;
        const suggestions = filterCountries(options, inputValue, focused);
        const showSuggestions = focused && suggestions.length > 0;

        const selectCountry = (option: CountryOption) => {
          onChange(option.name as PathValue<T, FieldPath<T>>);
          setQuery(null);
          setFocused(false);
          onBlur();
        };

        return (
          <FormField label={label} required={required} error={error?.message} hint={hint}>
            <View style={styles.wrap}>
              <TextInput
                ref={ref}
                value={inputValue}
                placeholder={placeholder}
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  setQuery(null);
                  onBlur();
                }}
                onChangeText={(text) => {
                  setQuery(text);
                  onChange(text as PathValue<T, FieldPath<T>>);
                }}
                style={[
                  formControlStyles.control,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.surface,
                    borderColor: error ? theme.error : theme.border,
                  },
                ]}
              />

              {showSuggestions ? (
                <View
                  style={[
                    styles.suggestions,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  {suggestions.map((option) => (
                    <Pressable
                      key={option.code}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${option.name}`}
                      onPressIn={() => selectCountry(option)}
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        { borderBottomColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText style={styles.suggestionLabel}>{option.name}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </FormField>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
  },
  suggestions: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
});
