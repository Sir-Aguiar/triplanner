import { z } from 'zod';

import { COUNTRIES } from '@/constants/countries';

function normalizeCountry(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Schema do formulário de cadastro.
 * `confirmPassword` e a validação de país ficam só no cliente.
 */
export const signUpFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'O usuário deve ter ao menos 3 caracteres')
      .max(30, 'O usuário deve ter no máximo 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: 'Use apenas letras, números e underscore',
      }),
    name: z
      .string()
      .trim()
      .min(2, 'Informe seu nome (mínimo 2 caracteres)'),
    email: z.email({ error: 'Informe um e-mail válido' }),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
    location: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const location = data.location?.trim();
      if (!location) {
        return true;
      }

      return COUNTRIES.some((country) => normalizeCountry(country.name) === normalizeCountry(location));
    },
    {
      message: 'Selecione um país da lista',
      path: ['location'],
    },
  );

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

/** Payload enviado para `POST /auth/signup`. */
export type SignUpDTO = {
  username: string;
  name: string;
  email: string;
  password: string;
  location?: string;
};

export const signUpDefaultValues: SignUpFormValues = {
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  location: '',
};

/** Remove campos exclusivos do formulário antes de chamar a API. */
export function toSignUpDTO(values: SignUpFormValues): SignUpDTO {
  const location = values.location?.trim();

  return {
    username: values.username,
    name: values.name,
    email: values.email,
    password: values.password,
    ...(location ? { location } : {}),
  };
}
