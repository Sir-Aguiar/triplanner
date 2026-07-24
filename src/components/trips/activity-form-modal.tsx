import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  FormCategorySelect,
  FormCurrencyInput,
  FormDateInput,
  FormSwitch,
  FormTextArea,
  FormTextInput,
} from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import {
  createActivityDefaultValues,
  createActivitySchema,
  type CreateActivityDTO,
  type CreateActivityFormValues,
} from '@/dtos';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { createActivity } from '@/services/activities/createActivity';
import { addPendingActivity } from '@/stores/pending-activities';
import { fromUtcIsoDate } from '@/utils/dates';

type ActivityFormModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Quando informado, salva no banco. Sem tripId, guarda em cache temporário. */
  tripId?: string;
  onSaved?: (data: CreateActivityDTO) => void;
};

export function ActivityFormModal({
  visible,
  onClose,
  tripId,
  onSaved,
}: ActivityFormModalProps) {
  const theme = useTheme();
  const { showToast } = useToast();
  const { categories, loading: loadingCategories } = useCategories();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateActivityFormValues, unknown, CreateActivityDTO>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: createActivityDefaultValues,
    mode: 'onSubmit',
  });

  const startTime = useWatch({ control, name: 'startTime' });
  const isBusy = submitting || isSubmitting;

  useEffect(() => {
    if (visible) {
      reset(createActivityDefaultValues);
    }
  }, [visible, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      if (tripId) {
        await createActivity(tripId, data);
      } else {
        addPendingActivity(data);
      }

      showToast('Atividade adicionada!');
      onSaved?.(data);
      onClose();
    } catch (error) {
      console.error('Falha ao salvar atividade:', error);
      showToast('Não foi possível salvar a atividade.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
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
                Nova atividade
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.description}>
                Informe categoria, horários e custos para montar o roteiro.
              </ThemedText>
            </View>

            {loadingCategories ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.form}>
                <FormCategorySelect
                  control={control}
                  name="categoryId"
                  label="Categoria"
                  required
                  options={categories}
                />

                <FormTextInput
                  control={control}
                  name="title"
                  label="Título / Nome do Local"
                  required
                  placeholder="Ex: Museu Oscar Niemeyer"
                  autoCapitalize="sentences"
                />

                <FormDateInput
                  control={control}
                  name="startTime"
                  label="Data de Início"
                  required
                />

                <FormDateInput
                  control={control}
                  name="endTime"
                  label="Data de Término"
                  hint="Opcional"
                  minimumDate={startTime ? fromUtcIsoDate(startTime) : undefined}
                />

                <FormCurrencyInput
                  control={control}
                  name="cost"
                  label="Custo Estimado"
                  allowEmpty
                  placeholder="R$ 0,00"
                  hint="Opcional"
                />

                <FormSwitch
                  control={control}
                  name="isPerPerson"
                  label="Custo por Pessoa"
                  required
                  description="Marque se o valor informado é por viajante."
                />

                <FormTextArea
                  control={control}
                  name="notes"
                  label="Anotações / Detalhes"
                  placeholder="Reservas, endereços, dicas..."
                  hint="Opcional"
                />
              </ScrollView>
            )}

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Button
                label="Cancelar"
                variant="secondary"
                disabled={isBusy}
                onPress={onClose}
                style={styles.footerButton}
              />
              <Button
                label="Salvar Atividade"
                loading={isBusy}
                disabled={isBusy || loadingCategories}
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
    maxHeight: '92%',
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
  loadingBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
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
