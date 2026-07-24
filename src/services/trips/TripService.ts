import type { CreateActivityDTO, CreateTripDTO } from '@/dtos';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';
import {
  activityRepository,
  tripRepository,
  type ActivityRepository,
  type InsertActivityRecord,
  type InsertTripRecord,
  type TripRepository,
  type UpdateTripRecord,
} from '@/repositories';
import { ServiceError, toServiceError } from '@/services/errors';
import {
  DEFAULT_PERSISTENCE_MODE,
  type PersistenceMode,
} from '@/services/persistence';
import {
  clearPendingActivities,
  getPendingActivities,
  type PendingActivity,
} from '@/stores/pending-activities';
import { applyTravelersChangeToBudget, sumActivityCosts } from '@/utils/budget';

function resolveEndTime(startTime: string, endTime: string): string {
  return endTime || startTime;
}

function toTripRecord(data: CreateTripDTO): InsertTripRecord {
  return {
    id: createUuidV4(),
    title: data.title,
    description: data.description,
    travelers: data.travelers,
    startDate: data.startDate,
    endDate: data.endDate,
    coverImage: '',
    totalBudget: data.totalBudget,
    isPublic: false,
  };
}

function toUpdateTripRecord(data: CreateTripDTO): UpdateTripRecord {
  return {
    title: data.title,
    description: data.description,
    travelers: data.travelers,
    startDate: data.startDate,
    endDate: data.endDate,
    totalBudget: data.totalBudget,
  };
}

function toActivityRecord(
  tripId: string,
  item: CreateActivityDTO | PendingActivity,
): InsertActivityRecord {
  return {
    id: createUuidV4(),
    tripId,
    categoryId: item.categoryId,
    title: item.title,
    notes: item.notes || null,
    startTime: item.startTime,
    endTime: resolveEndTime(item.startTime, item.endTime),
    cost: item.cost,
    isPerPerson: item.isPerPerson,
  };
}

type TripServiceDeps = {
  tripRepository?: TripRepository;
  activityRepository?: ActivityRepository;
  persistenceMode?: PersistenceMode;
};

export class TripService {
  private readonly tripRepository: TripRepository;
  private readonly activityRepository: ActivityRepository;
  private readonly persistenceMode: PersistenceMode;

  constructor(deps: TripServiceDeps = {}) {
    this.tripRepository = deps.tripRepository ?? tripRepository;
    this.activityRepository = deps.activityRepository ?? activityRepository;
    this.persistenceMode = deps.persistenceMode ?? DEFAULT_PERSISTENCE_MODE;
  }

  async create(data: CreateTripDTO): Promise<Trip> {
    try {
      if (this.persistenceMode === 'api') {
        return await this.createRemote(data);
      }
      return await this.createLocal(data);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível cadastrar a viagem');
    }
  }

  async update(tripId: string, data: CreateTripDTO): Promise<Trip> {
    try {
      if (this.persistenceMode === 'api') {
        throw new ServiceError('Atualização remota de viagem ainda não está disponível.');
      }

      const trip = await this.tripRepository.findById(tripId);
      const activities = await this.activityRepository.findByTripId(tripId);
      const previousSum = sumActivityCosts(activities, trip.travelers);
      const nextSum = sumActivityCosts(activities, data.travelers);

      const budgetAfterTravelers = applyTravelersChangeToBudget(
        data.totalBudget,
        previousSum,
        nextSum,
      );
      const nextBudget = Math.max(budgetAfterTravelers, nextSum);

      return await this.tripRepository.update(
        tripId,
        toUpdateTripRecord({ ...data, totalBudget: nextBudget }),
      );
    } catch (error) {
      throw toServiceError(error, 'Não foi possível atualizar a viagem');
    }
  }

  async delete(tripId: string): Promise<void> {
    try {
      if (this.persistenceMode === 'api') {
        throw new ServiceError('Exclusão remota de viagem ainda não está disponível.');
      }
      await this.tripRepository.deleteWithActivities(tripId);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível excluir a viagem');
    }
  }

  private async createLocal(data: CreateTripDTO): Promise<Trip> {
    const tripRecord = toTripRecord(data);
    const pending = getPendingActivities();
    const activityRecords = pending.map((item) => toActivityRecord(tripRecord.id, item));

    const trip = await this.tripRepository.insertWithActivities(tripRecord, activityRecords);
    clearPendingActivities();
    return trip;
  }

  private async createRemote(_data: CreateTripDTO): Promise<Trip> {
    throw new ServiceError(
      'Cadastro remoto de viagem ainda não está disponível. Use o modo local.',
    );
  }
}

export const tripService = new TripService();
