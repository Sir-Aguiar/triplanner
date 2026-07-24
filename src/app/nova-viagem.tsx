import { zodResolver } from '@hookform/resolvers/zod';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FormCurrencyInput,
  FormDateInput,
  FormNumberInput,
  FormTextArea,
  FormTextInput,
} from '@/components/form';
import { ActivityFormModal } from '@/components/trips/activity-form-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  BORDER_RADIUS,
  OPACITY,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import {
  createTripDefaultValues,
  createTripSchema,
  type CreateTripDTO,
  type CreateTripFormValues,
} from '@/dtos';
import { useTheme } from '@/hooks/use-theme';
import { createTrip } from '@/services/trips/createTrip';
import { fromUtcIsoDate } from '@/utils/dates';

export default function NovaViagemScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateTripFormValues, unknown, CreateTripDTO>({
    resolver: zodResolver(createTripSchema),
    defaultValues: createTripDefaultValues,
    mode: 'onSubmit',
  });

  const startDate = useWatch({ control, name: 'startDate' });
  const isBusy = submitting || isSubmitting;

  const onSubmit = handleSubmit(async (data) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      const trip = await createTrip(data);
      showToast('Viagem criada!');
      router.replace({
        pathname: '/viagem/[id]',
        params: { id: trip.id },
      });
    } catch (error) {
      console.error('Falha ao criar viagem:', error);
      showToast('Não foi possível salvar a viagem.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={88}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText themeColor="textSecondary" style={styles.intro}>
              Informe destino, período e quantidade de pessoas para organizar paradas, atividades e
              orçamento.
            </ThemedText>

            <View style={styles.fields}>
              <FormTextInput
                control={control}
                name="title"
                label="Título"
                required
                placeholder="Ex: Férias em Florianópolis"
                autoCapitalize="sentences"
                returnKeyType="next"
              />

              <FormDateInput
                control={control}
                name="startDate"
                label="Data de Início"
                required
              />

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
                allowEmpty
                placeholder="R$ 0,00"
                tooltip="Este campo não precisa ser preenchido. O custo será calculado conforme você cadastrar atividades."
              />

              <FormTextArea
                control={control}
                name="description"
                label="Descrição / Anotações"
                placeholder="Notas sobre a viagem, preferências, etc."
                hint="Opcional"
              />
            </View>

            <View
              style={[
                styles.activityCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={styles.activityCopy}>
                <ThemedText type="smallBold">Atividades</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  Cadastre paradas e passeios desta viagem.
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar atividade"
                onPress={() => setActivityModalOpen(true)}
                style={({ pressed }) => [
                  styles.activityCta,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add' }}
                  size={TYPOGRAPHY.sizes.md}
                  tintColor={theme.textInverse}
                  weight="medium"
                />
                <ThemedText style={[styles.activityCtaLabel, { color: theme.textInverse }]}>
                  Adicionar atividade
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button
              label="Salvar Viagem"
              loading={isBusy}
              disabled={isBusy}
              onPress={() => void onSubmit()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ActivityFormModal
        visible={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  intro: {
    textAlign: 'left',
  },
  fields: {
    gap: SPACING.md,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  activityCopy: {
    gap: SPACING.xs,
  },
  activityCta: {
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  activityCtaLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  pressed: {
    opacity: OPACITY.pressed,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
});
