export interface IActivity {
  activityId: string;
  tripId: string;
  categoryId: string;
  title: string;
  notes?: string | null;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
  createdAt: string;
  updatedAt: string;
}
