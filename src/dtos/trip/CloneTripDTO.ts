import { z } from 'zod';

import type { SyncActivityResponseDto } from '@/dtos/sync/SyncTripsDTO';

/** Body enviado ao POST /trips/:originalTripId/clone */
export type CloneTripRequestDto = {
  newStartDate: string;
};

/** Viagem retornada pela API de clonagem (sem activities aninhadas). */
export type CloneTripDto = {
  tripId: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  coverImage: string;
  totalBudget: number;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type CloneActivityDto = SyncActivityResponseDto;

/** Resposta 201 do endpoint de clonagem. */
export type CloneTripResponseDto = {
  trip: CloneTripDto;
  activities: CloneActivityDto[];
};

const cloneTripFormSchema = z.object({
  newStartDate: z
    .string()
    .min(1, 'Informe a data de início')
    .pipe(z.iso.datetime({ error: 'Data de início inválida' })),
});

export type CloneTripFormValues = z.input<typeof cloneTripFormSchema>;
export type CloneTripFormDTO = z.output<typeof cloneTripFormSchema>;

export { cloneTripFormSchema };

export const cloneTripDefaultValues: CloneTripFormValues = {
  newStartDate: '',
};
