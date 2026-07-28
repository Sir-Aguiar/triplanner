import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import {
  mapLocalTripsToSyncPayload,
  type SyncTripsResponseDto,
} from '@/dtos';
import { syncRepository, type SyncRepository } from '@/repositories/sync/SyncRepository';

export type SyncResult = 'ok' | 'offline' | 'error' | 'skipped';

type SyncServiceDeps = {
  syncRepository?: SyncRepository;
};

/**
 * Orquestra upload local → POST /trips/sync → consolidação em batch (RN02–RN04).
 * Falhas de rede são silenciosas para a UI (RN03).
 */
export class SyncService {
  private readonly syncRepository: SyncRepository;
  private inFlight: Promise<SyncResult> | null = null;

  constructor(deps: SyncServiceDeps = {}) {
    this.syncRepository = deps.syncRepository ?? syncRepository;
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

      return 'ok';
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        return 'offline';
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
