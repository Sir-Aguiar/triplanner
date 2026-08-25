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
import { isInternetReachable } from '@/utils/network';

export type SyncResult = 'ok' | 'offline' | 'error' | 'skipped' | 'unauthorized';

type SyncServiceDeps = {
  syncRepository?: SyncRepository;
  coverUploadService?: CoverUploadService;
};

/**
 * Orquestra upload local → POST /trips/sync → consolidação em batch (RN02–RN04).
 * Após sync JSON ok, dispara o job isolado de upload de capas locais.
 * Falhas de rede são silenciosas para a UI (RN03).
 *
 * Mutações autenticadas com internet aguardam este ciclo para manter app e servidor alinhados.
 * Offline: o dado já está no WatermelonDB; o próximo reconnect/abertura envia o lote.
 */
export class SyncService {
  private readonly syncRepository: SyncRepository;
  private readonly coverUploadService: CoverUploadService;
  /** Serializa syncs para não descartar mutações feitas durante um ciclo em andamento. */
  private syncChain: Promise<void> = Promise.resolve();

  constructor(deps: SyncServiceDeps = {}) {
    this.syncRepository = deps.syncRepository ?? syncRepository;
    this.coverUploadService = deps.coverUploadService ?? coverUploadService;
  }

  async syncNow(accessToken: string, userId: string): Promise<SyncResult> {
    const run = this.syncChain.then(
      () => this.runSync(accessToken, userId),
      () => this.runSync(accessToken, userId),
    );

    this.syncChain = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }

  /**
   * Sync quando houver sessão. Usado na abertura/fechamento do app e no reconnect.
   * Sem login → `skipped`. Sem rede o HTTP devolve `offline`.
   */
  async syncIfAuthenticated(): Promise<SyncResult> {
    const accessToken = await getStoredAccessToken();
    const user = await getStoredUser();

    if (!accessToken || !user?.userId) {
      return 'skipped';
    }

    return this.syncNow(accessToken, user.userId);
  }

  /**
   * Após create/update/delete local: se estiver online e autenticado, envia agora
   * (`POST /trips/sync`, DELETE de viagens, capas) e aplica o snapshot do servidor.
   * Offline ou convidado → no-op; o dado local permanece até haver internet.
   */
  async syncAfterLocalChange(): Promise<SyncResult> {
    if (!(await isInternetReachable())) {
      return 'offline';
    }

    return this.syncIfAuthenticated();
  }

  /** Dispara sync em background (reconnect / ciclo de vida). Não bloqueia a UI. */
  scheduleSyncAfterMutation(): void {
    void this.syncAfterLocalChange();
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
      await this.clearResolvedActivityDeletes(serverTrips, pendingActivityDeletes);

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

  /** Envia DELETE pendente de viagens. Atividades saem no POST /trips/sync da viagem. */
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
  }

  /**
   * Se o snapshot do sync já não traz a atividade, o servidor absorveu a exclusão
   * via POST /trips/sync — o tombstone local pode sair.
   */
  private async clearResolvedActivityDeletes(
    serverTrips: SyncTripsResponseDto['trips'],
    pendingActivityDeletes: string[],
  ): Promise<void> {
    if (pendingActivityDeletes.length === 0) {
      return;
    }

    const returnedActivityIds = new Set(
      serverTrips.flatMap((trip) => (trip.activities ?? []).map((item) => item.activityId)),
    );

    for (const activityId of pendingActivityDeletes) {
      if (!returnedActivityIds.has(activityId)) {
        await removePendingActivityDelete(activityId);
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
