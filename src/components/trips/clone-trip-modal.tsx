import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { FormDateInput } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import {
  cloneTripDefaultValues,
  cloneTripFormSchema,
  type CloneTripFormDTO,
  type CloneTripFormValues,
} from '@/dtos';
import { useTheme } from '@/hooks/use-theme';
import { toUtcIsoDate } from '@/utils/dates';

type CloneTripModalProps = {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (newStartDate: string) => void;
};

export function CloneTripModal({
  visible,
  submitting = false,
  onClose,
  onConfirm,
}: CloneTripModalProps) {
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CloneTripFormValues, unknown, CloneTripFormDTO>({
    resolver: zodResolver(cloneTripFormSchema),
    defaultValues: cloneTripDefaultValues,
    mode: 'onSubmit',
  });

  const isBusy = submitting || isSubmitting;

  useEffect(() => {
    if (!visible) {
      return;
    }
    reset({ newStartDate: toUtcIsoDate(new Date()) });
  }, [visible, reset]);

  const onSubmit = handleSubmit((data) => {
    if (isBusy) {
      return;
    }
    onConfirm(data.newStartDate);
  });

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          disabled={isBusy}
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Para quando é a sua viagem?
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.description}>
                Escolha a nova data de início. O restante do roteiro será recalculado automaticamente.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <FormDateInput control={control} name="newStartDate" label="Data de início" required />
            </View>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Button
                label="Cancelar"
                variant="secondary"
                disabled={isBusy}
                onPress={onClose}
                style={styles.footerButton}
              />
              <Button
                label="Clonar roteiro"
                loading={isBusy}
                disabled={isBusy}
                onPress={() => void onSubmit()}
                style={styles.footerButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
  form: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  footerButton: {
    flex: 1,
  },
});
