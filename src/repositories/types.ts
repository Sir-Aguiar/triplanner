/** Registro pronto para inserção local de viagem (sem lógica de negócio). */
export type InsertTripRecord = {
  id: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  coverImage: string;
  totalBudget: number;
  isPublic: boolean;
  /** `null` em modo convidado; preenchido quando autenticado. */
  userId: string | null;
};

/** Campos atualizáveis de uma viagem existente. */
export type UpdateTripRecord = {
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
  isPublic: boolean;
};

/** Registro pronto para inserção local de atividade. */
export type InsertActivityRecord = {
  id: string;
  tripId: string;
  categoryId: string;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
};

/** Campos atualizáveis de uma atividade existente. */
export type UpdateActivityRecord = {
  categoryId: string;
  title: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
};
