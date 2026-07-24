import type { CreateTripDTO } from '@/dtos';
import { getDatabase } from '@/database/client';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';

/**
 * Persiste uma nova viagem no WatermelonDB.
 * RN03: isPublic = false | RN04: UUID v4 | RN05: createdAt/updatedAt pelo WatermelonDB
 */
export async function createTrip(data: CreateTripDTO): Promise<Trip> {
  const database = getDatabase();
  const trips = database.get<Trip>('trips');
  const tripId = createUuidV4();

  return database.write(async () =>
    trips.create((trip) => {
      trip._raw.id = tripId;
      trip.title = data.title;
      trip.description = data.description;
      trip.travelers = data.travelers;
      trip.startDate = data.startDate;
      trip.endDate = data.endDate;
      trip.coverImage = '';
      trip.totalBudget = data.totalBudget;
      trip.isPublic = false;
    }),
  );
}
