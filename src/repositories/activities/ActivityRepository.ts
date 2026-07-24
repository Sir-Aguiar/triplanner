import { Q } from '@nozbe/watermelondb';

import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { toRepositoryError } from '@/repositories/errors';
import type { InsertActivityRecord } from '@/repositories/types';
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

export class ActivityRepository {
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

  async sumCostsByTripId(tripId: string): Promise<number> {
    try {
      const activities = await this.findByTripId(tripId);
      return sumActivityCosts(activities);
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

  /**
   * Insere atividade e atualiza o totalBudget da viagem na mesma transação.
   */
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
}

export const activityRepository = new ActivityRepository();
