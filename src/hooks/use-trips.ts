import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import { useSession } from "@/contexts/session";
import { getDatabase } from "@/database";
import type Trip from "@/database/models/Trip";

export type TripListItem = {
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

export type TripLane = "future" | "ongoing" | "past";

const TRIP_OBSERVED_COLUMNS = [
  "title",
  "description",
  "travelers",
  "start_date",
  "end_date",
  "cover_image",
  "total_budget",
  "is_public",
  "user_id",
] as const;

const LANE_ORDER: Record<TripLane, number> = {
  future: 0,
  ongoing: 1,
  past: 2,
};

export function getTripLane(trip: Pick<TripListItem, "startDate" | "endDate">, now = Date.now()): TripLane {
  const start = Date.parse(trip.startDate);
  const end = Date.parse(trip.endDate);

  if (Number.isFinite(start) && start > now) {
    return "future";
  }

  if (Number.isFinite(end) && end < now) {
    return "past";
  }

  return "ongoing";
}

/** Futuras → em andamento → passadas; dentro de cada raia, por `startDate` asc. */
export function sortTripsByLane(trips: TripListItem[], now = Date.now()): TripListItem[] {
  return [...trips].sort((a, b) => {
    const laneDiff = LANE_ORDER[getTripLane(a, now)] - LANE_ORDER[getTripLane(b, now)];
    if (laneDiff !== 0) {
      return laneDiff;
    }
    return Date.parse(a.startDate) - Date.parse(b.startDate);
  });
}

function toTripListItem(trip: Trip): TripListItem {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    travelers: trip.travelers,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverImage: trip.coverImage,
    totalBudget: trip.totalBudget,
    isPublic: trip.isPublic,
  };
}

/**
 * Lista reativa das viagens do usuário na sessão atual (coleção local).
 * Convidado: `user_id IS NULL`. Autenticado: `user_id = user.userId`.
 * ready: true até a primeira emissão do observable.
*/

export function useTrips(): { trips: TripListItem[]; ready: boolean } {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const ownerUserId = isLoggedIn ? (user?.userId ?? null) : null;

  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    const database = getDatabase();
    const subscription = database
      .get<Trip>("trips")
      .query(Q.where("user_id", ownerUserId), Q.sortBy("start_date", Q.asc))
      .observeWithColumns([...TRIP_OBSERVED_COLUMNS])
      .subscribe({
        next: (records) => {
          setTrips(sortTripsByLane(records.map(toTripListItem)));
          setReady(true);
        },
        error: () => {
          setTrips([]);
          setReady(true);
        },
      });

    return () => subscription.unsubscribe();
  }, [sessionLoading, ownerUserId]);

  return { trips, ready };
}

