import { z } from 'zod';

/**
 * Schema do formulário de criação de atividade.
 * tripId, activityId, createdAt e updatedAt são preenchidos no serviço.
 */
export const createActivitySchema = z
  .object({
    categoryId: z.string().min(1, 'Selecione a categoria'),
    title: z
      .string()
      .trim()
      .min(1, 'Informe o título da atividade')
      .max(120, 'O título deve ter no máximo 120 caracteres'),
    startTime: z
      .string()
      .min(1, 'Informe a data de início')
      .pipe(z.iso.datetime({ error: 'Data de início inválida' })),
    endTime: z.string().default(''),
    cost: z
      .number()
      .min(0, 'O custo não pode ser negativo')
      .nullable()
      .optional()
      .transform((value) => value ?? 0),
    isPerPerson: z.boolean().default(false),
    notes: z
      .string()
      .trim()
      .max(2000, 'As anotações devem ter no máximo 2000 caracteres')
      .optional()
      .transform((value) => value ?? ''),
  })
  .superRefine((data, ctx) => {
    if (!data.endTime) {
      return;
    }

    const end = Date.parse(data.endTime);
    if (Number.isNaN(end)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Data de término inválida',
        path: ['endTime'],
      });
      return;
    }

    if (end < Date.parse(data.startTime)) {
      ctx.addIssue({
        code: 'custom',
        message: 'A data de término não pode ser anterior ao início',
        path: ['endTime'],
      });
    }
  });

export type CreateActivityFormValues = z.input<typeof createActivitySchema>;
export type CreateActivityDTO = z.output<typeof createActivitySchema>;

export const createActivityDefaultValues: CreateActivityFormValues = {
  categoryId: '',
  title: '',
  startTime: '',
  endTime: '',
  cost: null,
  isPerPerson: false,
  notes: '',
};
