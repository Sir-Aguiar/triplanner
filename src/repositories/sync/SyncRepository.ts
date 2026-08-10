import { Q, type Model } from '@nozbe/watermelondb';

import type { CloneActivityDto, CloneTripDto, SyncActivityResponseDto, SyncTripResponseDto } from '@/dtos';
import { toTimestampMs } from '@/database/audit';
import { getDatabase } from '@/database/client';
import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { toRepositoryError } from '@/repositories/errors';
import { isLocalCoverUri } from '@/utils/cover-image';

export type OwnedTripWithActivities = {
  trip: Trip;
  activities: Activity[];
};

type ServerTripFields = Omit<SyncTripResponseDto, 'activities'> | CloneTripDto;
type ServerActivityFields = SyncActivityResponseDto | CloneActivityDto;

function tripDirtyRaw(trip: ServerTripFields): Record<string, unknown> {
  return {
    id: trip.tripId,
    title: trip.title,
    description: trip.description,
    travelers: trip.travelers,
    start_date: trip.startDate,
    end_date: trip.endDate,
    cover_image: trip.coverImage,
    total_budget: trip.totalBudget,
    is_public: trip.isPublic,
    user_id: trip.userId,
    created_at: toTimestampMs(trip.createdAt),
    updated_at: toTimestampMs(trip.updatedAt),
  };
}

function activityDirtyRaw(activity: ServerActivityFields): Record<string, unknown> {
  return {
    id: activity.activityId,
    trip_id: activity.tripId,
    category_id: activity.categoryId,
    title: activity.title,
    notes: activity.notes || null,
    start_time: activity.startTime,
    end_time: activity.endTime,
    cost: activity.cost,
    is_per_person: activity.isPerPerson,
    created_at: toTimestampMs(activity.createdAt),
    updated_at: toTimestampMs(activity.updatedAt),
  };
}

function applyTripFields(record: Trip, trip: SyncTripResponseDto): void {
  record.title = trip.title;
  record.description = trip.description;
  record.travelers = trip.travelers;
  record.startDate = trip.startDate;
  record.endDate = trip.endDate;
  // Preserva capa local pendente de upload — o snapshot JSON não deve apagar `file://`.
  if (!isLocalCoverUri(record.coverImage)) {
    record.coverImage = trip.coverImage;
  }
  record.totalBudget = trip.totalBudget;
  record.isPublic = trip.isPublic;
  record.userId = trip.userId;
  record._setRaw('created_at', toTimestampMs(trip.createdAt));
  record._setRaw('updated_at', toTimestampMs(trip.updatedAt));
}

function applyActivityFields(
  record: Activity,
  activity: SyncTripResponseDto['activities'][number],
): void {
  record._setRaw('trip_id', activity.tripId);
  record._setRaw('category_id', activity.categoryId);
  record.title = activity.title;
  record.notes = activity.notes || null;
  record.startTime = activity.startTime;
  record.endTime = activity.endTime;
  record.cost = activity.cost;
  record.isPerPerson = activity.isPerPerson;
  record._setRaw('created_at', toTimestampMs(activity.createdAt));
  record._setRaw('updated_at', toTimestampMs(activity.updatedAt));
}

/**
 * Persistência de sync: leitura do conjunto do usuário e consolidação em batch (RN04).
 */
export class SyncRepository {
  async findOwnedWithActivities(userId: string): Promise<OwnedTripWithActivities[]> {
    try {
      const database = getDatabase();
      const trips = await database
        .get<Trip>('trips')
        .query(Q.where('user_id', userId))
        .fetch();

      const result: OwnedTripWithActivities[] = [];

      for (const trip of trips) {
        const activities = await database
          .get<Activity>('activities')
          .query(Q.where('trip_id', trip.id), Q.sortBy('start_time', Q.asc))
          .fetch();
        result.push({ trip, activities });
      }

      return result;
    } catch (error) {
      throw toRepositoryError(error, 'Não foi possível carregar viagens locais para sincronizar');
    }
  }

  /**
   * Insere viagem clonada (e atividades) com os IDs do servidor, em um único batch.
   * Os registros já existem na nuvem — não devem ser tratados como criação local pendente.
   */
  async ingestClonedTrip(trip: CloneTripDto, activities: CloneActivityDto[]): Promise<void> {
    try {
      const database = getDatabase();
      const tripsCollection = database.get<Trip>('trips');
      const activitiesCollection = database.get<Activity>('activities');

      const tripPayload: CloneTripDto = {
        ...trip,
        isPublic: false,
      };

      const batch: Model[] = [
        tripsCollection.prepareCreateFromDirtyRaw(tripDirtyRaw(tripPayload)),
        ...activities.map((activity) =>
          activitiesCollection.prepareCreateFromDirtyRaw(activityDirtyRaw(activity)),
        ),
      ];

      await database.write(async () => {
        await database.batch(...batch);
      });
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao salvar o roteiro clonado no banco local');
    }
  }

  /**
   * Substitui o conjunto do usuário pelo snapshot do servidor em uma única transação.
   */
  async applyServerSnapshot(userId: string, serverTrips: SyncTripResponseDto[]): Promise<void> {
    try {
      const database = getDatabase();
      const tripsCollection = database.get<Trip>('trips');
      const activitiesCollection = database.get<Activity>('activities');

      const ownedTrips = await tripsCollection.query(Q.where('user_id', userId)).fetch();
      const ownedTripIds = new Set(ownedTrips.map((trip) => trip.id));
      const serverTripIds = new Set(serverTrips.map((trip) => trip.tripId));

      const existingTripsById = new Map(ownedTrips.map((trip) => [trip.id, trip]));

      for (const serverTrip of serverTrips) {
        if (existingTripsById.has(serverTrip.tripId)) {
          continue;
        }
        try {
          existingTripsById.set(serverTrip.tripId, await tripsCollection.find(serverTrip.tripId));
        } catch {
          // será criada
        }
      }

      const tripIdsForActivities = new Set<string>([
        ...ownedTripIds,
        ...serverTrips.map((trip) => trip.tripId),
        ...existingTripsById.keys(),
      ]);

      const relatedActivities =
        tripIdsForActivities.size === 0
          ? []
          : await activitiesCollection
              .query(Q.where('trip_id', Q.oneOf([...tripIdsForActivities])))
              .fetch();

      const activitiesByTripId = new Map<string, Activity[]>();
      const activitiesById = new Map<string, Activity>();
      for (const activity of relatedActivities) {
        activitiesById.set(activity.id, activity);
        const tripId = String(activity._getRaw('trip_id') ?? '');
        const list = activitiesByTripId.get(tripId) ?? [];
        list.push(activity);
        activitiesByTripId.set(tripId, list);
      }

      const batch: Model[] = [];
      const destroyedActivityIds = new Set<string>();
      const destroyedTripIds = new Set<string>();

      for (const serverTrip of serverTrips) {
        const existingTrip = existingTripsById.get(serverTrip.tripId);
        if (existingTrip) {
          batch.push(
            existingTrip.prepareUpdate((record) => {
              applyTripFields(record, serverTrip);
            }),
          );
        } else {
          batch.push(tripsCollection.prepareCreateFromDirtyRaw(tripDirtyRaw(serverTrip)));
        }

        const serverActivityIds = new Set(serverTrip.activities.map((item) => item.activityId));

        for (const serverActivity of serverTrip.activities) {
          let existingActivity = activitiesById.get(serverActivity.activityId);
          if (!existingActivity) {
            try {
              existingActivity = await activitiesCollection.find(serverActivity.activityId);
              activitiesById.set(existingActivity.id, existingActivity);
            } catch {
              existingActivity = undefined;
            }
          }

          if (existingActivity) {
            batch.push(
              existingActivity.prepareUpdate((record) => {
                applyActivityFields(record, serverActivity);
              }),
            );
          } else {
            batch.push(
              activitiesCollection.prepareCreateFromDirtyRaw(activityDirtyRaw(serverActivity)),
            );
          }
        }

        for (const localActivity of activitiesByTripId.get(serverTrip.tripId) ?? []) {
          if (serverActivityIds.has(localActivity.id) || destroyedActivityIds.has(localActivity.id)) {
            continue;
          }
          destroyedActivityIds.add(localActivity.id);
          batch.push(localActivity.prepareDestroyPermanently());
        }
      }

      for (const ownedTrip of ownedTrips) {
        if (serverTripIds.has(ownedTrip.id) || destroyedTripIds.has(ownedTrip.id)) {
          continue;
        }

        for (const activity of activitiesByTripId.get(ownedTrip.id) ?? []) {
          if (destroyedActivityIds.has(activity.id)) {
            continue;
          }
          destroyedActivityIds.add(activity.id);
          batch.push(activity.prepareDestroyPermanently());
        }

        destroyedTripIds.add(ownedTrip.id);
        batch.push(ownedTrip.prepareDestroyPermanently());
      }

      if (batch.length === 0) {
        return;
      }

      await database.write(async () => {
        await database.batch(...batch);
      });
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao consolidar sincronização no banco local');
    }
  }

  /** Apaga todas as viagens e atividades (logoff “Apagar Tudo”). Categorias permanecem. */
  async clearAllTripsAndActivities(): Promise<void> {
    try {
      const database = getDatabase();
      const trips = await database.get<Trip>('trips').query().fetch();
      const activities = await database.get<Activity>('activities').query().fetch();

      if (trips.length === 0 && activities.length === 0) {
        return;
      }

      await database.write(async () => {
        await database.batch(
          ...activities.map((activity) => activity.prepareDestroyPermanently()),
          ...trips.map((trip) => trip.prepareDestroyPermanently()),
        );
      });
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao limpar viagens e atividades locais');
    }
  }

  /** Remove a associação do usuário, mantendo os registros (logoff “Manter Dados”). */
  async orphanOwnedTrips(userId: string): Promise<number> {
    try {
      const database = getDatabase();
      const owned = await database
        .get<Trip>('trips')
        .query(Q.where('user_id', userId))
        .fetch();

      if (owned.length === 0) {
        return 0;
      }

      await database.write(async () => {
        await database.batch(
          ...owned.map((trip) =>
            trip.prepareUpdate((record) => {
              record.userId = null;
            }),
          ),
        );
      });

      return owned.length;
    } catch (error) {
      throw toRepositoryError(error, 'Falha ao desvincular viagens locais da conta');
    }
  }
}

export const syncRepository = new SyncRepository();
