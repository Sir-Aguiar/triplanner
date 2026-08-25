import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  FormCurrencyInput,
  FormDateInput,
  FormNumberInput,
  FormTextArea,
  FormTextInput,
} from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import {
  createTripDefaultValues,
  createTripSchema,
  type CreateTripDTO,
  type CreateTripFormValues,
} from '@/dtos';
import { useTheme } from '@/hooks/use-theme';
import { tripService } from '@/services';
import { formatCurrencyBrl } from '@/utils/currency';
import { fromUtcIsoDate } from '@/utils/dates';

export type TripFormInitialValues = {
  id: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
};

type TripFormModalProps = {
  visible: boolean;
  onClose: () => void;
  trip: TripFormInitialValues;
  /** Soma efetiva das atividades — piso do orçamento. */
  activitiesCostSum?: number;
  onSaved?: () => void;
};

function toFormValues(trip: TripFormInitialValues): CreateTripFormValues {
  return {
    title: trip.title,
    description: trip.description,
    travelers: trip.travelers,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalBudget: trip.totalBudget > 0 ? trip.totalBudget : null,
  };
}

export function TripFormModal({
  visible,
  onClose,
  trip,
  activitiesCostSum = 0,
  onSaved,
}: TripFormModalProps) {
  const theme = useTheme();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const minBudgetRef = useRef(activitiesCostSum);
  minBudgetRef.current = activitiesCostSum;

  const dynamicResolver = useMemo(
    () => async (values: CreateTripFormValues, context: unknown, options: unknown) => {
      const schema = createTripSchema({ minBudget: minBudgetRef.current });
      // @ts-expect-error — assinatura compatível com zodResolver em runtime
      return zodResolver(schema)(values, context, options);
    },
    [],
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateTripFormValues, unknown, CreateTripDTO>({
    resolver: dynamicResolver,
    defaultValues: createTripDefaultValues,
    mode: 'onSubmit',
  });

  const startDate = useWatch({ control, name: 'startDate' });
  const isBusy = submitting || isSubmitting;

  useEffect(() => {
    if (!visible) {
      return;
    }
    reset(toFormValues(trip));
  }, [visible, trip, reset]);

  useEffect(() => {
    if (!visible || activitiesCostSum <= 0) {
      return;
    }

    setValue('totalBudget', Math.max(trip.totalBudget, activitiesCostSum), {
      shouldValidate: true,
    });
  }, [visible, activitiesCostSum, trip.totalBudget, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      await tripService.update(trip.id, data);
      showToast('Viagem atualizada!');
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Falha ao atualizar viagem:', error);
      showToast('Não foi possível atualizar a viagem.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                Editar viagem
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.description}>
                Atualize os dados gerais da viagem.
              </ThemedText>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}>
              <FormTextInput
                control={control}
                name="title"
                label="Título"
                required
                placeholder="Ex: Férias em Florianópolis"
                autoCapitalize="sentences"
              />

              <FormDateInput control={control} name="startDate" label="Data de Início" required />

              <FormDateInput
                control={control}
                name="endDate"
                label="Data de Término"
                required
                minimumDate={startDate ? fromUtcIsoDate(startDate) : undefined}
              />

              <FormNumberInput
                control={control}
                name="travelers"
                label="Quantidade de Viajantes"
                required
                mode="integer"
                placeholder="1"
              />

              <FormCurrencyInput
                control={control}
                name="totalBudget"
                label="Custo Total Previsto"
                allowEmpty={activitiesCostSum === 0}
                placeholder="R$ 0,00"
                hint={
                  activitiesCostSum > 0
                    ? `Mínimo: ${formatCurrencyBrl(activitiesCostSum)}`
                    : undefined
                }
                tooltip="O custo não pode ficar abaixo da soma das atividades."
              />

              <FormTextArea
                control={control}
                name="description"
                label="Descrição / Anotações"
                placeholder="Notas sobre a viagem..."
                hint="Opcional"
              />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Button
                label="Cancelar"
                variant="secondary"
                disabled={isBusy}
                onPress={onClose}
                style={styles.footerButton}
              />
              <Button
                label="Salvar alterações"
                loading={isBusy}
                disabled={isBusy}
                onPress={() => void onSubmit()}
                style={styles.footerButton}
              />
            </View>
          </View>
        </View>
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
    zIndex: 1,
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
