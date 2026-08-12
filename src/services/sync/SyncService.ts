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
      const owned = await this.syncRepository.findOwnedWithActivities(userId);
      const payload = mapLocalTripsToSyncPayload(owned);

      const response = await apiRequest<SyncTripsResponseDto>('/trips/sync', {
        method: 'POST',
        body: payload,
        accessToken,
      });

      const serverTrips = Array.isArray(response?.trips) ? response.trips : [];
      await this.syncRepository.applyServerSnapshot(userId, serverTrips);

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

  async clearLocalTripData(): Promise<void> {
    await this.syncRepository.clearAllTripsAndActivities();
  }

  async orphanLocalTrips(userId: string): Promise<void> {
    await this.syncRepository.orphanOwnedTrips(userId);
  }
}

export const syncService = new SyncService();
