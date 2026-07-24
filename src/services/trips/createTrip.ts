import type { CreateActivityDTO, CreateTripDTO } from '@/dtos';
import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';
import {
  clearPendingActivities,
  getPendingActivities,
} from '@/stores/pending-activities';

function resolveEndTime(data: CreateActivityDTO): string {
  return data.endTime || data.startTime;
}

/**
 * Persiste uma nova viagem e, em seguida, as atividades pendentes do formulário.
 * RN03: isPublic = false | RN04: UUID v4 | RN05: createdAt/updatedAt pelo WatermelonDB
 */
export async function createTrip(data: CreateTripDTO): Promise<Trip> {
  const database = getDatabase();
  const trips = database.get<Trip>('trips');
  const activities = database.get<Activity>('activities');
  const tripId = createUuidV4();
  const pending = getPendingActivities();

  const trip = await database.write(async () => {
    const createdTrip = await trips.create((record) => {
      record._raw.id = tripId;
      record.title = data.title;
      record.description = data.description;
      record.travelers = data.travelers;
      record.startDate = data.startDate;
      record.endDate = data.endDate;
      record.coverImage = '';
      record.totalBudget = data.totalBudget;
      record.isPublic = false;
    });

    for (const item of pending) {
      await activities.create((activity) => {
        activity._raw.id = createUuidV4();
        activity._setRaw('trip_id', tripId);
        activity._setRaw('category_id', item.categoryId);
        activity.title = item.title;
        activity.notes = item.notes || null;
        activity.startTime = item.startTime;
        activity.endTime = resolveEndTime(item);
        activity.cost = item.cost;
        activity.isPerPerson = item.isPerPerson;
      });
    }

    return createdTrip;
  });

  clearPendingActivities();
  return trip;
}
