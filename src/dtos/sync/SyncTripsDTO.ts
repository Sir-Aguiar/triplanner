import type Activity from '@/database/models/Activity';
import type Trip from '@/database/models/Trip';
import { toIsoUtc } from '@/database/audit';

/** Placeholder quando a viagem local ainda não tem capa (DTO do servidor exige min(1)). */
export const SYNC_COVER_IMAGE_PLACEHOLDER = 'placeholder';

/** Atividade no payload de upload (alinhado ao Zod do servidor — sem userId). */
export type SyncActivityDto = {
  activityId: string;
  tripId: string;
  categoryId: string;
  title: string;
  notes: string;
  startTime: string;
  endTime: string;
  cost: number;
  isPerPerson: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Viagem no payload de upload (sem userId — o servidor usa o JWT). */
export type SyncTripDto = {
  tripId: string;
  title: string;
  description: string;
  travelers: number;
  startDate: string;
  endDate: string;
  coverImage: string;
  totalBudget: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  activities: SyncActivityDto[];
};

export type SyncTripsDto = {
  trips: SyncTripDto[];
};

/** Atividade na resposta consolidada do servidor. */
export type SyncActivityResponseDto = SyncActivityDto;

/** Viagem na resposta consolidada (inclui userId). */
export type SyncTripResponseDto = SyncTripDto & {
  userId: string;
  activities: SyncActivityResponseDto[];
};

export type SyncTripsResponseDto = {
  trips: SyncTripResponseDto[];
};

export type LocalTripWithActivities = {
  trip: Trip;
  activities: Activity[];
};

function rawRelationId(model: Activity, column: 'trip_id' | 'category_id'): string {
  return String(model._getRaw(column) ?? '');
}

export function mapActivityToSyncDto(activity: Activity): SyncActivityDto {
  return {
    activityId: activity.id,
    tripId: rawRelationId(activity, 'trip_id'),
    categoryId: rawRelationId(activity, 'category_id'),
    title: activity.title,
    notes: activity.notes ?? '',
    startTime: toIsoUtc(activity.startTime),
    endTime: toIsoUtc(activity.endTime),
    cost: activity.cost,
    isPerPerson: activity.isPerPerson,
    createdAt: toIsoUtc(activity.createdAt),
    updatedAt: toIsoUtc(activity.updatedAt),
  };
}

export function mapTripToSyncDto(trip: Trip, activities: Activity[]): SyncTripDto {
  return {
    tripId: trip.id,
    title: trip.title,
    description: trip.description,
    travelers: trip.travelers,
    startDate: toIsoUtc(trip.startDate),
    endDate: toIsoUtc(trip.endDate),
    coverImage: trip.coverImage || SYNC_COVER_IMAGE_PLACEHOLDER,
    totalBudget: trip.totalBudget,
    isPublic: trip.isPublic,
    createdAt: toIsoUtc(trip.createdAt),
    updatedAt: toIsoUtc(trip.updatedAt),
    activities: activities.map(mapActivityToSyncDto),
  };
}

export function mapLocalTripsToSyncPayload(
  items: LocalTripWithActivities[],
): SyncTripsDto {
  return {
    trips: items.map(({ trip, activities }) => mapTripToSyncDto(trip, activities)),
  };
}
