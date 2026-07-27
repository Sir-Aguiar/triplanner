import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormPasswordInput, FormTextInput } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { OPACITY, SPACING } from '@/constants/theme';
import {
  signInDefaultValues,
  signInFormSchema,
  toSignInDTO,
  type SignInFormValues,
} from '@/dtos';
import { useCompleteAuth } from '@/hooks/use-complete-auth';
import { useTheme } from '@/hooks/use-theme';
import { authService, ServiceError } from '@/services';

export default function EntrarScreen() {
  const theme = useTheme();
  const completeAuth = useCompleteAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: signInDefaultValues,
    mode: 'onSubmit',
  });

  const isBusy = submitting || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.signIn(toSignInDTO(values));
      completeAuth(result);
      showToast('Login realizado!');
    } catch (error) {
      console.error('Falha ao entrar:', error);
      const message =
        error instanceof ServiceError
          ? error.message
          : 'Não foi possível entrar. Tente novamente.';
      showToast(message);
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
              Entre com seu e-mail ou nome de usuário para acessar suas viagens na nuvem.
            </ThemedText>

            <View style={styles.fields}>
              <FormTextInput
                control={control}
                name="identifier"
                label="E-mail ou usuário"
                required
                placeholder="voce@email.com ou viajante_123"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
              />

              <FormPasswordInput
                control={control}
                name="password"
                label="Senha"
                required
                placeholder="Sua senha"
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
              />
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/criar-conta')}
              style={({ pressed }) => [styles.footerHint, pressed && styles.pressed]}>
              <ThemedText themeColor="textSecondary">
                Não tem conta? <ThemedText type="linkPrimary">Criar Conta</ThemedText>
              </ThemedText>
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button
              label="Entrar"
              loading={isBusy}
              disabled={isBusy}
              onPress={() => void onSubmit()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  footerHint: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
