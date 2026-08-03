import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { CloneTripResponseDto, CreateActivityDTO, CreateTripDTO } from '@/dtos';
import type Trip from '@/database/models/Trip';
import { createUuidV4 } from '@/database/uuid';
import {
  activityRepository,
  syncRepository,
  tripRepository,
  type ActivityRepository,
  type InsertActivityRecord,
  type InsertTripRecord,
  type SyncRepository,
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
import { sumActivityCosts, syncBudgetWithSpent } from '@/utils/budget';

function resolveEndTime(startTime: string, endTime: string): string {
  return endTime || startTime;
}

export type CreateTripOptions = {
  /** ID do usuário autenticado; omitir/`null` em modo convidado. */
  userId?: string | null;
};

function toTripRecord(data: CreateTripDTO, userId: string | null): InsertTripRecord {
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
    userId,
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
  syncRepository?: SyncRepository;
  persistenceMode?: PersistenceMode;
};

export class TripService {
  private readonly tripRepository: TripRepository;
  private readonly activityRepository: ActivityRepository;
  private readonly syncRepository: SyncRepository;
  private readonly persistenceMode: PersistenceMode;

  constructor(deps: TripServiceDeps = {}) {
    this.tripRepository = deps.tripRepository ?? tripRepository;
    this.activityRepository = deps.activityRepository ?? activityRepository;
    this.syncRepository = deps.syncRepository ?? syncRepository;
    this.persistenceMode = deps.persistenceMode ?? DEFAULT_PERSISTENCE_MODE;
  }

  async create(data: CreateTripDTO, options: CreateTripOptions = {}): Promise<Trip> {
    try {
      if (this.persistenceMode === 'api') {
        return await this.createRemote(data);
      }
      return await this.createLocal(data, options.userId ?? null);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível cadastrar a viagem');
    }
  }

  async update(tripId: string, data: CreateTripDTO): Promise<Trip> {
    try {
      if (this.persistenceMode === 'api') {
        throw new ServiceError('Atualização remota de viagem ainda não está disponível.');
      }

      const activities = await this.activityRepository.findByTripId(tripId);
      const nextSum = sumActivityCosts(activities, data.travelers);
      const nextBudget = syncBudgetWithSpent(data.totalBudget, nextSum);

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

  /**
   * Vincula viagens órfãs (criadas como convidado) ao usuário autenticado.
   * Idempotente — seguro chamar no login e na restauração de sessão.
   */
  async claimOrphanTrips(userId: string): Promise<number> {
    try {
      return await this.tripRepository.assignUserToOrphanTrips(userId);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível vincular viagens locais à conta');
    }
  }

  /**
   * Clona um roteiro via API (POST /trips/:id/clone) e ingere o resultado no WatermelonDB.
   * Usa exclusivamente os IDs retornados pelo servidor.
   */
  async clone(originalTripId: string, newStartDate: string, accessToken: string): Promise<string> {
    try {
      const response = await apiRequest<CloneTripResponseDto>(`/trips/${originalTripId}/clone`, {
        method: 'POST',
        body: { newStartDate },
        accessToken,
      });

      const trip = response?.trip;
      if (!trip?.tripId) {
        throw new ServiceError('Resposta inválida ao clonar o roteiro');
      }

      const activities = Array.isArray(response.activities) ? response.activities : [];
      await this.syncRepository.ingestClonedTrip(trip, activities);
      return trip.tripId;
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        throw new ServiceError(
          'Conecte-se à internet para clonar este roteiro do servidor',
          error,
        );
      }

      if (error instanceof ServiceError) {
        throw error;
      }

      if (error instanceof ApiError) {
        throw new ServiceError('Ocorreu um erro ao clonar o roteiro, tente novamente', error);
      }

      throw toServiceError(error, 'Ocorreu um erro ao clonar o roteiro, tente novamente');
    }
  }

  private async createLocal(data: CreateTripDTO, userId: string | null): Promise<Trip> {
    const tripRecord = toTripRecord(data, userId);
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
