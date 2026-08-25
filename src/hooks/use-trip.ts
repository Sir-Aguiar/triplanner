import { useEffect, useState } from 'react';

import { getDatabase } from '@/database';
import type Trip from '@/database/models/Trip';

export type TripDetails = {
  id: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
  coverImage: string;
  isPublic: boolean;
};

function toTripDetails(trip: Trip): TripDetails {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    travelers: trip.travelers,
    startDate: trip.startDate,
    endDate: trip.endDate,
    totalBudget: trip.totalBudget,
    coverImage: trip.coverImage,
    isPublic: trip.isPublic,
  };
}

export function useTrip(tripId?: string): {
  trip: TripDetails | null;
  loading: boolean;
  error: string | null;
} {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      setError('Viagem não encontrada.');
      return;
    }

    const database = getDatabase();
    const subscription = database
      .get<Trip>('trips')
      .findAndObserve(tripId)
      .subscribe({
        next: (record) => {
          // Snapshot: findAndObserve emite a mesma instância do Model;
          // React ignora setState com a mesma referência.
          setTrip(toTripDetails(record));
          setLoading(false);
          setError(null);
        },
        error: () => {
          setTrip(null);
          setLoading(false);
          setError('Não foi possível carregar esta viagem.');
        },
      });

    return () => subscription.unsubscribe();
  }, [tripId]);

  return { trip, loading, error };
}
