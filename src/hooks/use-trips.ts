import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import { getDatabase } from '@/database';
import type Trip from '@/database/models/Trip';

export type TripListItem = {
  id: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
};

export function useTrips(): {
  trips: TripListItem[];
  loading: boolean;
} {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const database = getDatabase();
    const subscription = database
      .get<Trip>('trips')
      .query(Q.sortBy('start_date', Q.asc))
      .observe()
      .subscribe({
        next: (records) => {
          setTrips(
            records.map((trip) => ({
              id: trip.id,
              title: trip.title,
              description: trip.description,
              travelers: trip.travelers,
              startDate: trip.startDate,
              endDate: trip.endDate,
              totalBudget: trip.totalBudget,
            })),
          );
          setLoading(false);
        },
        error: () => {
          setTrips([]);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  return { trips, loading };
}
