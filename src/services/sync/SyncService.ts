import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import { getStoredAccessToken, getStoredUser } from '@/api/token-storage';
import {
  mapLocalTripsToSyncPayload,
  type SyncTripsResponseDto,
} from '@/dtos';
import { syncRepository, type SyncRepository } from '@/repositories/sync/SyncRepository';
import {
  coverUploadService,
  type CoverUploadService,
} from '@/services/trips/CoverUploadService';
import {
  getPendingActivityDeletes,
  getPendingTripDeletes,
  removePendingActivityDelete,
  removePendingTripDelete,
} from '@/stores/pending-deletes';

export type SyncResult = 'ok' | 'offline' | 'error' | 'skipped' | 'unauthorized';

type SyncServiceDeps = {
  syncRepository?: SyncRepository;
  coverUploadService?: CoverUploadService;
};

/**
 * Orquestra upload local → POST /trips/sync → consolidação em batch (RN02–RN04).
 * Após sync JSON ok, dispara o job isolado de upload de capas locais.
 * Falhas de rede são silenciosas para a UI (RN03).
 */
export class SyncService {
  private readonly syncRepository: SyncRepository;
  private readonly coverUploadService: CoverUploadService;
  private inFlight: Promise<SyncResult> | null = null;

  constructor(deps: SyncServiceDeps = {}) {
    this.syncRepository = deps.syncRepository ?? syncRepository;
    this.coverUploadService = deps.coverUploadService ?? coverUploadService;
  }

  async syncNow(accessToken: string, userId: string): Promise<SyncResult> {
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.runSync(accessToken, userId).finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  /**
   * Sync imediato após mutação local quando houver sessão.
   * Sem login ou sem rede → `skipped`/`offline` (não bloqueia a UI).
   */
  async syncIfAuthenticated(): Promise<SyncResult> {
    const accessToken = await getStoredAccessToken();
    const user = await getStoredUser();

    if (!accessToken || !user?.userId) {
      return 'skipped';
    }

    return this.syncNow(accessToken, user.userId);
  }

  /** Dispara sync em background após editar/excluir viagem ou atividade. */
  scheduleSyncAfterMutation(): void {
    void this.syncIfAuthenticated();
  }

  private async runSync(accessToken: string, userId: string): Promise<SyncResult> {
    try {
      await this.flushPendingDeletes(accessToken);

      const owned = await this.syncRepository.findOwnedWithActivities(userId);
      const payload = mapLocalTripsToSyncPayload(owned);

      const response = await apiRequest<SyncTripsResponseDto>('/trips/sync', {
        method: 'POST',
        body: payload,
        accessToken,
      });

      const serverTrips = Array.isArray(response?.trips) ? response.trips : [];
      const pendingTripDeletes = await getPendingTripDeletes();
      const pendingActivityDeletes = await getPendingActivityDeletes();
      await this.syncRepository.applyServerSnapshot(userId, serverTrips, {
        excludeTripIds: pendingTripDeletes,
        excludeActivityIds: pendingActivityDeletes,
      });

      // RN02: só após o JSON da Trip existir no backend.
      try {
        await this.coverUploadService.uploadPendingCovers(accessToken, userId);
      } catch (coverError) {
        console.error('Falha no job de upload de capas:', coverError);
      }

      return 'ok';
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        return 'offline';
      }

      if (error instanceof ApiError && error.status === 401) {
        return 'unauthorized';
      }

      console.error('Falha na sincronização de viagens:', error);
      return 'error';
    }
  }

  /** Envia DELETE pendente de viagens e atividades que ainda não chegaram ao servidor. */
  private async flushPendingDeletes(accessToken: string): Promise<void> {
    const pendingTrips = await getPendingTripDeletes();

    for (const tripId of pendingTrips) {
      try {
        await apiRequest(`/trips/${tripId}`, {
          method: 'DELETE',
          accessToken,
        });
        await removePendingTripDelete(tripId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await removePendingTripDelete(tripId);
          continue;
        }

        if (error instanceof ApiError && error.status === 0) {
          break;
        }

        console.error(`Falha ao confirmar exclusão remota da viagem ${tripId}:`, error);
      }
    }

    const pendingActivities = await getPendingActivityDeletes();

    for (const activityId of pendingActivities) {
      try {
        await apiRequest(`/activities/${activityId}`, {
          method: 'DELETE',
          accessToken,
        });
        await removePendingActivityDelete(activityId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await removePendingActivityDelete(activityId);
          continue;
        }

        if (error instanceof ApiError && error.status === 0) {
          break;
        }

        console.error(`Falha ao confirmar exclusão remota da atividade ${activityId}:`, error);
      }
    }
  }

  async clearLocalTripData(): Promise<void> {
    await this.syncRepository.clearAllTripsAndActivities();
  }

  async orphanLocalTrips(userId: string): Promise<void> {
    await this.syncRepository.orphanOwnedTrips(userId);
  }
}

export const syncService = new SyncService();
