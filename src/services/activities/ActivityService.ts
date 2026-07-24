import type { CreateActivityDTO } from '@/dtos';
import type Activity from '@/database/models/Activity';
import { createUuidV4 } from '@/database/uuid';
import {
  activityRepository,
  tripRepository,
  type ActivityRepository,
  type InsertActivityRecord,
  type TripRepository,
  type UpdateActivityRecord,
} from '@/repositories';
import { ServiceError, toServiceError } from '@/services/errors';
import {
  DEFAULT_PERSISTENCE_MODE,
  type PersistenceMode,
} from '@/services/persistence';
import {
  applyActivityCostToBudget,
  applyActivityRemovalFromBudget,
  resolveActivityTotalCost,
} from '@/utils/budget';

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

function toUpdateActivityRecord(data: CreateActivityDTO): UpdateActivityRecord {
  return {
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

  async update(activityId: string, data: CreateActivityDTO): Promise<Activity> {
    try {
      if (this.persistenceMode === 'api') {
        throw new ServiceError('Atualização remota de atividade ainda não está disponível.');
      }

      const activity = await this.activityRepository.findById(activityId);
      const relatedTrip = await activity.trip.fetch();
      const tripId = relatedTrip.id;
      const trip = await this.tripRepository.findById(tripId);
      const travelers = trip.travelers;

      const currentSum = await this.activityRepository.sumCostsByTripId(tripId, travelers);
      const oldContribution = resolveActivityTotalCost(activity, travelers);
      const newContribution = resolveActivityTotalCost(data, travelers);
      const nextSum = currentSum - oldContribution + newContribution;
      const nextBudget = Math.max(
        (trip.totalBudget ?? 0) - oldContribution + newContribution,
        nextSum,
      );

      return await this.activityRepository.updateAndSyncTripBudget(
        activityId,
        toUpdateActivityRecord(data),
        nextBudget,
      );
    } catch (error) {
      throw toServiceError(error, 'Não foi possível atualizar a atividade');
    }
  }

  async delete(activityId: string): Promise<void> {
    try {
      if (this.persistenceMode === 'api') {
        throw new ServiceError('Exclusão remota de atividade ainda não está disponível.');
      }

      const activity = await this.activityRepository.findById(activityId);
      const relatedTrip = await activity.trip.fetch();
      const tripId = relatedTrip.id;
      const trip = await this.tripRepository.findById(tripId);
      const travelers = trip.travelers;

      const currentSum = await this.activityRepository.sumCostsByTripId(tripId, travelers);
      const contribution = resolveActivityTotalCost(activity, travelers);
      const nextSum = currentSum - contribution;
      const nextBudget = applyActivityRemovalFromBudget(
        trip.totalBudget,
        contribution,
        nextSum,
      );

      await this.activityRepository.deleteAndSyncTripBudget(activityId, nextBudget);
    } catch (error) {
      throw toServiceError(error, 'Não foi possível excluir a atividade');
    }
  }

  async syncTripBudgetFromActivities(tripId: string): Promise<number> {
    try {
      const trip = await this.tripRepository.findById(tripId);
      const activitiesSum = await this.activityRepository.sumCostsByTripId(
        tripId,
        trip.travelers,
      );
      const nextBudget = Math.max(trip.totalBudget, activitiesSum);

      if (nextBudget !== trip.totalBudget) {
        await this.tripRepository.updateTotalBudget(tripId, nextBudget);
      }

      return nextBudget;
    } catch (error) {
      throw toServiceError(error, 'Não foi possível sincronizar o custo da viagem');
    }
  }

  private async createLocal(tripId: string, data: CreateActivityDTO): Promise<Activity> {
    const trip = await this.tripRepository.findById(tripId);
    const travelers = trip.travelers;
    const currentSum = await this.activityRepository.sumCostsByTripId(tripId, travelers);
    const contribution = resolveActivityTotalCost(data, travelers);
    const nextSum = currentSum + contribution;
    const nextBudget = applyActivityCostToBudget(trip.totalBudget, contribution, nextSum);
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
