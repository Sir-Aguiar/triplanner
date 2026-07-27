import { z } from 'zod';

/**
 * Formulário de login: um único campo aceita e-mail ou username.
 * O payload da API envia apenas um dos dois (XOR), conforme o backend.
 */
export const signInFormSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Informe e-mail ou usuário'),
    password: z.string().min(1, 'Informe a senha'),
  })
  .superRefine((data, ctx) => {
    const identifier = data.identifier.trim();

    if (identifier.includes('@')) {
      const emailResult = z.email().safeParse(identifier);
      if (!emailResult.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe um e-mail válido',
          path: ['identifier'],
        });
      }
      return;
    }

    if (identifier.length < 3) {
      ctx.addIssue({
        code: 'custom',
        message: 'O usuário deve ter ao menos 3 caracteres',
        path: ['identifier'],
      });
    }
  });

export type SignInFormValues = z.infer<typeof signInFormSchema>;

/** Payload enviado para `POST /auth/signin`. */
export type SignInDTO =
  | { email: string; password: string }
  | { username: string; password: string };

export const signInDefaultValues: SignInFormValues = {
  identifier: '',
  password: '',
};

export function toSignInDTO(values: SignInFormValues): SignInDTO {
  const identifier = values.identifier.trim();

  if (identifier.includes('@')) {
    return {
      email: identifier,
      password: values.password,
    };
  }

  return {
    username: identifier,
    password: values.password,
  };
}
