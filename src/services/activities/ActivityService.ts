import type { CreateActivityDTO } from '@/dtos';
import type Activity from '@/database/models/Activity';
import { createUuidV4 } from '@/database/uuid';
import {
  activityRepository,
  tripRepository,
  type ActivityRepository,
  type InsertActivityRecord,
  type TripRepository,
} from '@/repositories';
import { ServiceError, toServiceError } from '@/services/errors';
import {
  DEFAULT_PERSISTENCE_MODE,
  type PersistenceMode,
} from '@/services/persistence';
import { applyActivityCostToBudget } from '@/utils/budget';

function resolveEndTime(startTime: string, endTime: string): string {
  return endTime || startTime;
}

function toActivityRecord(tripId: string, data: CreateActivityDTO): InsertActivityRecord {
  return {
    id: createUuidV4(),
    tripId,
    categoryId: data.categoryId,
    title: data.title,
    notes: data.notes || null,
    startTime: data.startTime,
    endTime: resolveEndTime(data.startTime, data.endTime),
    cost: data.cost,
    isPerPerson: data.isPerPerson,
  };
}

type ActivityServiceDeps = {
  activityRepository?: ActivityRepository;
  tripRepository?: TripRepository;
  persistenceMode?: PersistenceMode;
};

/**
 * Orquestra o cadastro de atividades.
 * Decide o destino da persistência (local agora; API no futuro).
 */
export class ActivityService {
  private readonly activityRepository: ActivityRepository;
  private readonly tripRepository: TripRepository;
  private readonly persistenceMode: PersistenceMode;

  constructor(deps: ActivityServiceDeps = {}) {
    this.activityRepository = deps.activityRepository ?? activityRepository;
    this.tripRepository = deps.tripRepository ?? tripRepository;
    this.persistenceMode = deps.persistenceMode ?? DEFAULT_PERSISTENCE_MODE;
  }

  async create(tripId: string, data: CreateActivityDTO): Promise<Activity> {
    try {
      if (this.persistenceMode === 'api') {
        return await this.createRemote(tripId, data);
      }

      return await this.createLocal(tripId, data);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível cadastrar a atividade');
    }
  }

  private async createLocal(tripId: string, data: CreateActivityDTO): Promise<Activity> {
    const trip = await this.tripRepository.findById(tripId);
    const currentSum = await this.activityRepository.sumCostsByTripId(tripId);
    const nextSum = currentSum + data.cost;
    const nextBudget = applyActivityCostToBudget(trip.totalBudget, data.cost, nextSum);
    const record = toActivityRecord(tripId, data);

    return this.activityRepository.insertAndUpdateTripBudget(record, nextBudget);
  }

  private async createRemote(_tripId: string, _data: CreateActivityDTO): Promise<Activity> {
    throw new ServiceError(
      'Cadastro remoto de atividade ainda não está disponível. Use o modo local.',
    );
  }
}

export const activityService = new ActivityService();
