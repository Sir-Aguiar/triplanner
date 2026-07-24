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
