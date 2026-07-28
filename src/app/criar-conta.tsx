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

import {
  FormCountryAutocomplete,
  FormPasswordInput,
  FormTextInput,
} from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { OPACITY, SPACING } from '@/constants/theme';
import {
  signUpDefaultValues,
  signUpFormSchema,
  toSignUpDTO,
  type SignUpFormValues,
} from '@/dtos';
import { useCompleteAuth } from '@/hooks/use-complete-auth';
import { useTheme } from '@/hooks/use-theme';
import { authService, ServiceError } from '@/services';

export default function CriarContaScreen() {
  const theme = useTheme();
  const completeAuth = useCompleteAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: signUpDefaultValues,
    mode: 'onSubmit',
  });

  const isBusy = submitting || isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    if (isBusy) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.signUp(toSignUpDTO(values));
      // Tokens já vêm no cadastro — autentica a sessão imediatamente.
      await completeAuth(result);
      showToast('Conta criada! Você já está logado.');
    } catch (error) {
      console.error('Falha ao criar conta:', error);
      const message =
        error instanceof ServiceError
          ? error.message
          : 'Não foi possível criar a conta. Tente novamente.';
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
              Crie sua conta para salvar viagens na nuvem, publicar roteiros e sincronizar entre
              aparelhos.
            </ThemedText>

            <View style={styles.fields}>
              <FormTextInput
                control={control}
                name="name"
                label="Nome"
                required
                placeholder="Seu nome completo"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />

              <FormTextInput
                control={control}
                name="username"
                label="Usuário"
                required
                placeholder="ex: viajante_123"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                hint="Letras, números e underscore"
              />

              <FormTextInput
                control={control}
                name="email"
                label="E-mail"
                required
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <FormCountryAutocomplete
                control={control}
                name="location"
                label="Localização"
                placeholder="Buscar país"
                hint="Opcional — por enquanto, somente Brasil"
              />

              <FormPasswordInput
                control={control}
                name="password"
                label="Senha"
                required
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />

              <FormPasswordInput
                control={control}
                name="confirmPassword"
                label="Confirmar senha"
                required
                placeholder="Repita a senha"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
              />
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/entrar')}
              style={({ pressed }) => [styles.footerHint, pressed && styles.pressed]}>
              <ThemedText themeColor="textSecondary">
                Já tem conta? <ThemedText type="linkPrimary">Entrar</ThemedText>
              </ThemedText>
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button
              label="Criar conta"
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
