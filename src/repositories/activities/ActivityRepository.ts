import { Q } from '@nozbe/watermelondb';

import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { toRepositoryError } from '@/repositories/errors';
import type { InsertActivityRecord, UpdateActivityRecord } from '@/repositories/types';
import { sumActivityCosts } from '@/utils/budget';

function mapActivityRecord(activity: Activity, record: InsertActivityRecord): void {
  activity._raw.id = record.id;
  activity._setRaw('trip_id', record.tripId);
  activity._setRaw('category_id', record.categoryId);
  activity.title = record.title;
  activity.notes = record.notes;
  activity.startTime = record.startTime;
  activity.endTime = record.endTime;
  activity.cost = record.cost;
  activity.isPerPerson = record.isPerPerson;
}

function applyActivityUpdate(activity: Activity, record: UpdateActivityRecord): void {
  activity._setRaw('category_id', record.categoryId);
  activity.title = record.title;
  activity.notes = record.notes;
  activity.startTime = record.startTime;
  activity.endTime = record.endTime;
  activity.cost = record.cost;
  activity.isPerPerson = record.isPerPerson;
}

export class ActivityRepository {
  async findById(activityId: string): Promise<Activity> {
    try {
      return await getDatabase().get<Activity>('activities').find(activityId);
    } catch (error) {
      throw toRepositoryError(error, 'Não foi possível carregar a atividade no banco local');
    }
  }

  async findByTripId(tripId: string): Promise<Activity[]> {
    try {
      return await getDatabase()
        .get<Activity>('activities')
        .query(Q.where('trip_id', tripId), Q.sortBy('start_time', Q.asc))
        .fetch();
    } catch (error) {
      throw toRepositoryError(error, 'Não foi possível listar atividades no banco local');
    }
  }

  async sumCostsByTripId(tripId: string, travelers: number): Promise<number> {
    try {
      const activities = await this.findByTripId(tripId);
      return sumActivityCosts(activities, travelers);
    } catch (error) {
      throw toRepositoryError(error, 'Não foi possível calcular o custo das atividades');
    }
  }

  async insert(record: InsertActivityRecord): Promise<Activity> {
    try {
      const database = getDatabase();
      const activities = database.get<Activity>('activities');

      return await database.write(async () =>
        activities.create((activity) => {
          mapActivityRecord(activity, record);
        }),
      );
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao inserir atividade no banco local');
    }
  }

  async insertAndUpdateTripBudget(
    record: InsertActivityRecord,
    nextTotalBudget: number,
  ): Promise<Activity> {
    try {
      const database = getDatabase();
      const activities = database.get<Activity>('activities');
      const trips = database.get<Trip>('trips');

      return await database.write(async () => {
        const activity = await activities.create((item) => {
          mapActivityRecord(item, record);
        });

        const trip = await trips.find(record.tripId);
        await trip.update((item) => {
          item.totalBudget = nextTotalBudget;
        });

        return activity;
      });
    } catch (error) {
      throw toRepositoryError(
        error,
        'Falha ao inserir atividade e atualizar custo da viagem no banco local',
      );
    }
  }

  async updateAndSyncTripBudget(
    activityId: string,
    record: UpdateActivityRecord,
    nextTotalBudget: number,
  ): Promise<Activity> {
    try {
      const database = getDatabase();
      const activity = await database.get<Activity>('activities').find(activityId);
      const relatedTrip = await activity.trip.fetch();
      const tripId = relatedTrip.id;

      await database.write(async () => {
        await activity.update((item) => {
          applyActivityUpdate(item, record);
        });

        const trip = await database.get<Trip>('trips').find(tripId);
        await trip.update((item) => {
          item.totalBudget = nextTotalBudget;
        });
      });

      return activity;
    } catch (error) {
      throw toRepositoryError(
        error,
        'Falha ao atualizar atividade e custo da viagem no banco local',
      );
    }
  }

  async deleteAndSyncTripBudget(activityId: string, nextTotalBudget: number): Promise<string> {
    try {
      const database = getDatabase();
      const activity = await database.get<Activity>('activities').find(activityId);
      const relatedTrip = await activity.trip.fetch();
      const tripId = relatedTrip.id;

      await database.write(async () => {
        await activity.destroyPermanently();

        const trip = await database.get<Trip>('trips').find(tripId);
        await trip.update((item) => {
          item.totalBudget = nextTotalBudget;
        });
      });

      return tripId;
    } catch (error) {
      throw toRepositoryError(
        error,
        'Falha ao excluir atividade e atualizar custo da viagem no banco local',
      );
    }
  }
}

export const activityRepository = new ActivityRepository();
