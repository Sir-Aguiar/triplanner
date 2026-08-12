import { zodResolver } from "@hookform/resolvers/zod";
import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormCurrencyInput, FormDateInput, FormNumberInput, FormTextArea, FormTextInput } from "@/components/form";
import { ActivityFormModal } from "@/components/trips/activity-form-modal";
import { ActivityTimeline, type ActivityListItem } from "@/components/trips/activity-timeline";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BORDER_RADIUS, FontFamily, OPACITY, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useSession } from "@/contexts/session";
import { createTripDefaultValues, createTripSchema, type CreateTripDTO, type CreateTripFormValues } from "@/dtos";
import { usePendingActivities } from "@/hooks/use-pending-activities";
import { mapPendingWithCategories } from "@/hooks/use-trip-activities";
import { useTheme } from "@/hooks/use-theme";
import { tripService } from "@/services";
import { clearPendingActivities, removePendingActivity } from "@/stores/pending-activities";
import { reconcileFormBudget, sumActivityCosts } from "@/utils/budget";
import { formatCurrencyBrl } from "@/utils/currency";
import { fromUtcIsoDate } from "@/utils/dates";

export default function NovaViagemScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const { showToast } = useToast();
  const pending = usePendingActivities();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingItems, setPendingItems] = useState<ActivityListItem[]>([]);

  const minBudgetRef = useRef(0);
  const previousActivitiesSumRef = useRef(0);
  const hasSyncedBudgetRef = useRef(false);

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
    setValue,
    getValues,
    clearErrors,
    formState: { isSubmitting },
  } = useForm<CreateTripFormValues, unknown, CreateTripDTO>({
    resolver: dynamicResolver,
    defaultValues: createTripDefaultValues,
    mode: "onSubmit",
  });

  const startDate = useWatch({ control, name: "startDate" });
  const travelersWatch = useWatch({ control, name: "travelers" });
  const travelers = Math.max(1, Number(travelersWatch) || 1);
  const isBusy = submitting || isSubmitting;

  const activitiesCostSum = useMemo(() => sumActivityCosts(pending, travelers), [pending, travelers]);

  useEffect(() => {
    clearPendingActivities();
    previousActivitiesSumRef.current = 0;
    minBudgetRef.current = 0;
    hasSyncedBudgetRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void mapPendingWithCategories(pending).then((items) => {
      if (!cancelled) {
        setPendingItems(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pending]);

  /**
   * Mantém totalBudget e o piso de validação sincronizados com a soma efetiva
   * das atividades (adição, remoção e mudança de viajantes).
   */
  useEffect(() => {
    minBudgetRef.current = activitiesCostSum;

    if (!hasSyncedBudgetRef.current) {
      hasSyncedBudgetRef.current = true;
      previousActivitiesSumRef.current = activitiesCostSum;
      return;
    }

    const previousSum = previousActivitiesSumRef.current;
    if (previousSum === activitiesCostSum) {
      return;
    }

    const nextBudget = reconcileFormBudget(getValues("totalBudget"), previousSum, activitiesCostSum);

    previousActivitiesSumRef.current = activitiesCostSum;

    setValue("totalBudget", nextBudget > 0 ? nextBudget : null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("totalBudget");
  }, [activitiesCostSum, getValues, setValue, clearErrors]);

  const handleDeletePendingActivity = (tempId: string) => {
    removePendingActivity(tempId);
    showToast("Atividade removida");
  };

  const onSubmit = handleSubmit(async (data) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      const trip = await tripService.create(data, { userId: user?.userId ?? null });
      showToast("Viagem criada!");
      router.replace({
        pathname: "/viagem/[id]",
        params: { id: trip.id },
      });
    } catch (error) {
      console.error("Falha ao criar viagem:", error);
      showToast("Não foi possível salvar a viagem.");
    } finally {
      setSubmitting(false);
    }
  });

  const budgetTooltip =
    activitiesCostSum > 0
      ? `O custo mínimo é ${formatCurrencyBrl(activitiesCostSum)} (soma das atividades). Você pode informar um valor maior.`
      : "Este campo não precisa ser preenchido. O custo será calculado conforme você cadastrar atividades.";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={88}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText themeColor="textSecondary" style={styles.intro}>
              Informe destino, período e quantidade de pessoas para organizar paradas, atividades e orçamento.
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
                tooltip={budgetTooltip}
                hint={activitiesCostSum > 0 ? `Mínimo: ${formatCurrencyBrl(activitiesCostSum)}` : undefined}
              />

              <FormTextArea
                control={control}
                name="description"
                label="Descrição / Anotações"
                placeholder="Notas sobre a viagem, preferências, etc."
                hint="Opcional"
              />
            </View>

            <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.activityCopy}>
                <ThemedText type="smallBold">Atividades</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {pending.length > 0
                    ? `${pending.length} atividade(s) pronta(s) para salvar com a viagem.`
                    : "Cadastre paradas e passeios desta viagem."}
                </ThemedText>
              </View>

              <ActivityTimeline
                activities={pendingItems}
                emptyMessage="Nenhuma atividade na fila ainda."
                onDelete={handleDeletePendingActivity}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar atividade"
                onPress={() => setActivityModalOpen(true)}
                style={({ pressed }) => [
                  styles.activityCta,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}
              >
                <SymbolView
                  name={{ ios: "plus", android: "add" }}
                  size={TYPOGRAPHY.sizes.md}
                  tintColor={theme.textOnAccent}
                  weight="medium"
                />
                <ThemedText style={[styles.activityCtaLabel, { color: theme.textOnAccent }]}>
                  Adicionar atividade
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button label="Salvar Viagem" loading={isBusy} disabled={isBusy} onPress={() => void onSubmit()} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ActivityFormModal visible={activityModalOpen} onClose={() => setActivityModalOpen(false)} />
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
    textAlign: "left",
  },
  fields: {
    gap: SPACING.md,
  },
  activityCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  activityCopy: {
    gap: SPACING.xs,
  },
  activityCta: {
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  activityCtaLabel: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
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

