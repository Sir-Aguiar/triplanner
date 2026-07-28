export interface ITrip {
  tripId: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  coverImage: string;
  totalBudget: number;
  isPublic: boolean;
  /** Dono autenticado; `null` enquanto a viagem for órfã (convidado). */
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}
