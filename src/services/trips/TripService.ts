import * as ImagePicker from 'expo-image-picker';

import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getStoredAccessToken } from '@/api/token-storage';
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
import { syncService } from '@/services/sync/SyncService';
import {
  deleteLocalCoverFile,
  persistCoverImage,
} from '@/services/trips/cover-storage';
import {
  clearPendingActivities,
  getPendingActivities,
  type PendingActivity,
} from '@/stores/pending-activities';
import {
  addPendingTripDelete,
  removePendingTripDelete,
} from '@/stores/pending-deletes';
import { sumActivityCosts, syncBudgetWithSpent } from '@/utils/budget';
import { isLocalCoverUri } from '@/utils/cover-image';
import { isInternetReachable } from '@/utils/network';

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
    isPublic: data.isPublic,
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
    isPublic: data.isPublic,
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
};

export class TripService {
  private readonly tripRepository: TripRepository;
  private readonly activityRepository: ActivityRepository;
  private readonly syncRepository: SyncRepository;

  constructor(deps: TripServiceDeps = {}) {
    this.tripRepository = deps.tripRepository ?? tripRepository;
    this.activityRepository = deps.activityRepository ?? activityRepository;
    this.syncRepository = deps.syncRepository ?? syncRepository;
  }

  async create(data: CreateTripDTO, options: CreateTripOptions = {}): Promise<Trip> {
    try {
      const trip = await this.createLocal(data, options.userId ?? null);
      await syncService.syncAfterLocalChange();
      return trip;
    } catch (error) {
      throw toServiceError(error, 'Não foi possível cadastrar a viagem');
    }
  }

  async update(tripId: string, data: CreateTripDTO): Promise<Trip> {
    try {
      const activities = await this.activityRepository.findByTripId(tripId);
      const nextSum = sumActivityCosts(activities, data.travelers);
      const nextBudget = syncBudgetWithSpent(data.totalBudget, nextSum);

      const trip = await this.tripRepository.update(
        tripId,
        toUpdateTripRecord({ ...data, totalBudget: nextBudget }),
      );
      await syncService.syncAfterLocalChange();
      return trip;
    } catch (error) {
      throw toServiceError(error, 'Não foi possível atualizar a viagem');
    }
  }

  async delete(tripId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findById(tripId);
      const previousCover = trip.coverImage;
      const accessToken = await getStoredAccessToken();
      const online = accessToken ? await isInternetReachable() : false;

      // Marca antes do sync em background poder reaplicar o snapshot do servidor.
      if (accessToken) {
        await addPendingTripDelete(tripId);
      }

      await this.tripRepository.deleteWithActivities(tripId);
      if (isLocalCoverUri(previousCover)) {
        await deleteLocalCoverFile(previousCover);
      }

      if (accessToken && online) {
        await this.deleteRemote(tripId, accessToken);
        await syncService.syncAfterLocalChange();
      }
    } catch (error) {
      throw toServiceError(error, 'Não foi possível excluir a viagem');
    }
  }

  /** DELETE /trips/:tripId. Sem rede ou erro recuperável → permanece na fila do próximo sync. */
  private async deleteRemote(tripId: string, accessToken: string): Promise<void> {
    try {
      await apiRequest(`/trips/${tripId}`, {
        method: 'DELETE',
        accessToken,
      });
      await removePendingTripDelete(tripId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await removePendingTripDelete(tripId);
        return;
      }

      await addPendingTripDelete(tripId);
      console.error('Falha ao excluir viagem no servidor:', error);
    }
  }

  /**
   * RN01: abre a galeria, copia a imagem para o armazenamento permanente,
   * grava `file://...` no WatermelonDB e retorna a viagem atualizada.
   * Com internet, o sync envia o JSON e em seguida o PATCH da capa.
   */
  async setCoverFromGallery(tripId: string): Promise<Trip | null> {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new ServiceError('Permissão para acessar a galeria foi negada.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return null;
      }

      const previousCover = (await this.tripRepository.findById(tripId)).coverImage;
      const permanentUri = await persistCoverImage(result.assets[0].uri, tripId);
      const trip = await this.tripRepository.updateCoverImage(tripId, permanentUri);

      if (isLocalCoverUri(previousCover) && previousCover !== permanentUri) {
        await deleteLocalCoverFile(previousCover);
      }

      await syncService.syncAfterLocalChange();
      return trip;
    } catch (error) {
      throw toServiceError(error, 'Não foi possível definir a capa da viagem');
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
}

export const tripService = new TripService();
