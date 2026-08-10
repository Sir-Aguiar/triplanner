import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { UploadTripCoverResponseDto } from '@/dtos/trip/UploadTripCoverDTO';
import type Trip from '@/database/models/Trip';
import {
  tripRepository,
  type TripRepository,
} from '@/repositories';
import { deleteLocalCoverFile } from '@/services/trips/cover-storage';
import { isLocalCoverUri, isServerCoverValue } from '@/utils/cover-image';

type CoverUploadServiceDeps = {
  tripRepository?: TripRepository;
};

function mimeTypeFromUri(uri: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const ext = withoutQuery.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

function filenameFromUri(uri: string, tripId: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const basename = withoutQuery.split('/').pop();
  if (basename && basename.includes('.')) {
    return basename;
  }
  return `cover-${tripId}.jpg`;
}

function extractRemoteCoverUrl(response: UploadTripCoverResponseDto | null | undefined): string {
  const candidates = [response?.coverImage, response?.trip?.coverImage];
  for (const candidate of candidates) {
    const value = candidate?.trim() ?? '';
    if (isServerCoverValue(value)) {
      return value;
    }
  }
  return '';
}

/**
 * Job secundário isolado do sync JSON (RN02–RN04):
 * após POST /trips/sync bem-sucedido, envia capas `file://` via PATCH multipart.
 */
export class CoverUploadService {
  private readonly tripRepository: TripRepository;
  private inFlight: Promise<void> | null = null;

  constructor(deps: CoverUploadServiceDeps = {}) {
    this.tripRepository = deps.tripRepository ?? tripRepository;
  }

  async uploadPendingCovers(accessToken: string, userId: string): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.runUploads(accessToken, userId).finally(() => {
      this.inFlight = null;
    });

    return this.inFlight;
  }

  private async runUploads(accessToken: string, userId: string): Promise<void> {
    let pending: Trip[];
    try {
      pending = await this.tripRepository.findWithPendingLocalCover(userId);
    } catch (error) {
      console.error('Falha ao listar capas pendentes:', error);
      return;
    }

    for (const trip of pending) {
      await this.uploadOne(trip, accessToken);
    }
  }

  private async uploadOne(trip: Trip, accessToken: string): Promise<void> {
    const localUri = trip.coverImage?.trim() ?? '';
    if (!isLocalCoverUri(localUri)) {
      return;
    }

    try {
      const formData = new FormData();
      // Nest `FileInterceptor('file', ...)` — o campo deve se chamar exatamente `file`.
      formData.append('file', {
        uri: localUri,
        name: filenameFromUri(localUri, trip.id),
        type: mimeTypeFromUri(localUri),
      } as unknown as Blob);

      const response = await apiRequest<UploadTripCoverResponseDto>(
        `/trips/${trip.id}/cover`,
        {
          method: 'PATCH',
          body: formData,
          accessToken,
        },
      );

      const remoteUrl = extractRemoteCoverUrl(response);
      if (!remoteUrl) {
        console.error('Resposta de upload de capa sem URL remota válida:', response);
        return;
      }

      // RN03: swap file:// → https:// no WatermelonDB
      await this.tripRepository.updateCoverImage(trip.id, remoteUrl);
      // RN04: limpa o arquivo físico local
      await deleteLocalCoverFile(localUri);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 0 || error.status === 401)) {
        return;
      }
      console.error(`Falha no upload da capa da viagem ${trip.id}:`, error);
    }
  }
}

export const coverUploadService = new CoverUploadService();
