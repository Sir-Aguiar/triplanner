import { Q } from '@nozbe/watermelondb';

import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { toRepositoryError } from '@/repositories/errors';
import type {
  InsertActivityRecord,
  InsertTripRecord,
  UpdateTripRecord,
} from '@/repositories/types';

function mapTripRecord(trip: Trip, record: InsertTripRecord): void {
  trip._raw.id = record.id;
  trip.title = record.title;
  trip.description = record.description;
  trip.travelers = record.travelers;
  trip.startDate = record.startDate;
  trip.endDate = record.endDate;
  trip.coverImage = record.coverImage;
  trip.totalBudget = record.totalBudget;
  trip.isPublic = record.isPublic;
  trip.userId = record.userId;
}

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

export class TripRepository {
  async findById(tripId: string): Promise<Trip> {
    try {
      return await getDatabase().get<Trip>('trips').find(tripId);
    } catch (error) {
      throw toRepositoryError(error, 'Não foi possível carregar a viagem no banco local');
    }
  }

  async insert(record: InsertTripRecord): Promise<Trip> {
    try {
      const database = getDatabase();
      const trips = database.get<Trip>('trips');

      return await database.write(async () =>
        trips.create((trip) => {
          mapTripRecord(trip, record);
        }),
      );
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao inserir viagem no banco local');
    }
  }

  async insertWithActivities(
    tripRecord: InsertTripRecord,
    activityRecords: InsertActivityRecord[],
  ): Promise<Trip> {
    try {
      const database = getDatabase();
      const trips = database.get<Trip>('trips');
      const activities = database.get<Activity>('activities');

      return await database.write(async () => {
        const trip = await trips.create((record) => {
          mapTripRecord(record, tripRecord);
        });

        for (const activityRecord of activityRecords) {
          await activities.create((activity) => {
            mapActivityRecord(activity, activityRecord);
          });
        }

        return trip;
      });
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao inserir viagem e atividades no banco local');
    }
  }

  async update(tripId: string, record: UpdateTripRecord): Promise<Trip> {
    try {
      const database = getDatabase();
      const trip = await database.get<Trip>('trips').find(tripId);

      await database.write(async () => {
        await trip.update((item) => {
          item.title = record.title;
          item.description = record.description;
          item.travelers = record.travelers;
          item.startDate = record.startDate;
          item.endDate = record.endDate;
          item.totalBudget = record.totalBudget;
        });
      });

      return trip;
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao atualizar a viagem no banco local');
    }
  }

  async updateTotalBudget(tripId: string, totalBudget: number): Promise<Trip> {
    try {
      const database = getDatabase();
      const trip = await database.get<Trip>('trips').find(tripId);

      await database.write(async () => {
        await trip.update((record) => {
          record.totalBudget = totalBudget;
        });
      });

      return trip;
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao atualizar o custo da viagem no banco local');
    }
  }

  /** Remove a viagem e todas as atividades vinculadas na mesma transação. */
  async deleteWithActivities(tripId: string): Promise<void> {
    try {
      const database = getDatabase();
      const trip = await database.get<Trip>('trips').find(tripId);
      const activities = await database
        .get<Activity>('activities')
        .query(Q.where('trip_id', tripId))
        .fetch();

      await database.write(async () => {
        for (const activity of activities) {
          await activity.destroyPermanently();
        }
        await trip.destroyPermanently();
      });
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao excluir a viagem no banco local');
    }
  }

  /**
   * Atribui `userId` às viagens órfãs (`user_id` nulo).
   * Usado no login / restauração de sessão (RF04 + edge case "Manter").
   * O `.update()` também renova `updated_at` (LWW).
   */
  async assignUserToOrphanTrips(userId: string): Promise<number> {
    try {
      const database = getDatabase();
      const orphans = await database
        .get<Trip>('trips')
        .query(Q.where('user_id', null))
        .fetch();

      if (orphans.length === 0) {
        return 0;
      }

      await database.write(async () => {
        for (const trip of orphans) {
          await trip.update((record) => {
            record.userId = userId;
          });
        }
      });

      return orphans.length;
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao atribuir dono às viagens locais');
    }
  }
}

export const tripRepository = new TripRepository();
