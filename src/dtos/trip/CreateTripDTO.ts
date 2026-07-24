import { z } from 'zod';

/**
 * Schema do formulário de criação de viagem.
 * Campos de sistema (tripId, isPublic, coverImage, createdAt, updatedAt)
 * são preenchidos no serviço de persistência.
 */
export const createTripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Informe o título da viagem')
      .max(120, 'O título deve ter no máximo 120 caracteres'),
    description: z
      .string()
      .trim()
      .max(2000, 'A descrição deve ter no máximo 2000 caracteres')
      .optional()
      .transform((value) => value ?? ''),
    travelers: z.coerce
      .number({ error: 'Informe a quantidade de viajantes' })
      .int('A quantidade de viajantes deve ser um número inteiro')
      .min(1, 'Informe ao menos 1 viajante'),
    startDate: z
      .string()
      .min(1, 'Informe a data de início')
      .pipe(z.iso.datetime({ error: 'Data de início inválida' })),
    endDate: z
      .string()
      .min(1, 'Informe a data de término')
      .pipe(z.iso.datetime({ error: 'Data de término inválida' })),
    totalBudget: z
      .number()
      .min(0, 'O orçamento não pode ser negativo')
      .nullable()
      .optional()
      .transform((value) => value ?? 0),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'A data de término não pode ser anterior ao início',
    path: ['endDate'],
  });

/** Valores do formulário (entrada do schema). */
export type CreateTripFormValues = z.input<typeof createTripSchema>;

/** Payload validado pronto para persistência (saída do schema). */
export type CreateTripDTO = z.output<typeof createTripSchema>;

export const createTripDefaultValues: CreateTripFormValues = {
  title: '',
  description: '',
  travelers: 1,
  startDate: '',
  endDate: '',
  totalBudget: null,
};
