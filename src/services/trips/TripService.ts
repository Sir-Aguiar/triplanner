import type { CreateActivityDTO, CreateTripDTO } from '@/dtos';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';
import {
  tripRepository,
  type InsertActivityRecord,
  type InsertTripRecord,
  type TripRepository,
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

function toActivityRecord(tripId: string, item: CreateActivityDTO | PendingActivity): InsertActivityRecord {
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
  persistenceMode?: PersistenceMode;
};

/**
 * Orquestra o cadastro de viagens.
 * Decide o destino da persistência (local agora; API no futuro).
 */
export class TripService {
  private readonly tripRepository: TripRepository;
  private readonly persistenceMode: PersistenceMode;

  constructor(deps: TripServiceDeps = {}) {
    this.tripRepository = deps.tripRepository ?? tripRepository;
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
