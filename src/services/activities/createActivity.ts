import { Q } from '@nozbe/watermelondb';

import type { CreateActivityDTO } from '@/dtos';
import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';
import { applyActivityCostToBudget, sumActivityCosts } from '@/utils/budget';

function resolveEndTime(data: CreateActivityDTO): string {
  return data.endTime || data.startTime;
}

/**
 * Persiste uma atividade vinculada a uma viagem existente e
 * soma o custo ao totalBudget da viagem (piso = soma das atividades).
 */
export async function createActivity(
  tripId: string,
  data: CreateActivityDTO,
): Promise<Activity> {
  const database = getDatabase();
  const activities = database.get<Activity>('activities');
  const trips = database.get<Trip>('trips');
  const activityId = createUuidV4();

  return database.write(async () => {
    const activity = await activities.create((record) => {
      record._raw.id = activityId;
      record._setRaw('trip_id', tripId);
      record._setRaw('category_id', data.categoryId);
      record.title = data.title;
      record.notes = data.notes || null;
      record.startTime = data.startTime;
      record.endTime = resolveEndTime(data);
      record.cost = data.cost;
      record.isPerPerson = data.isPerPerson;
    });

    const trip = await trips.find(tripId);
    const tripActivities = await activities.query(Q.where('trip_id', tripId)).fetch();
    const activitiesSum = sumActivityCosts(tripActivities);

    await trip.update((record) => {
      record.totalBudget = applyActivityCostToBudget(
        record.totalBudget,
        data.cost,
        activitiesSum,
      );
    });

    return activity;
  });
}

/** Cria várias atividades na mesma transação (ex.: pendentes pós-cadastro de viagem). */
export async function createActivitiesForTrip(
  tripId: string,
  items: CreateActivityDTO[],
): Promise<Activity[]> {
  if (items.length === 0) {
    return [];
  }

  const database = getDatabase();
  const activities = database.get<Activity>('activities');

  return database.write(async () => {
    const created: Activity[] = [];

    for (const data of items) {
      const activity = await activities.create((record) => {
        record._raw.id = createUuidV4();
        record._setRaw('trip_id', tripId);
        record._setRaw('category_id', data.categoryId);
        record.title = data.title;
        record.notes = data.notes || null;
        record.startTime = data.startTime;
        record.endTime = resolveEndTime(data);
        record.cost = data.cost;
        record.isPerPerson = data.isPerPerson;
      });
      created.push(activity);
    }

    return created;
  });
}
