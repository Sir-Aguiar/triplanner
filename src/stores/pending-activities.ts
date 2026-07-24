import type { CreateActivityDTO } from '@/dtos';
import { createUuidV4 } from '@/database/uuid';

export type PendingActivity = CreateActivityDTO & {
  tempId: string;
};

type Listener = () => void;

let pendingActivities: PendingActivity[] = [];
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getPendingActivities(): PendingActivity[] {
  return pendingActivities;
}

export function addPendingActivity(data: CreateActivityDTO): PendingActivity {
  const pending: PendingActivity = {
    ...data,
    tempId: createUuidV4(),
  };
  pendingActivities = [...pendingActivities, pending];
  notify();
  return pending;
}

export function removePendingActivity(tempId: string): void {
  pendingActivities = pendingActivities.filter((item) => item.tempId !== tempId);
  notify();
}

export function clearPendingActivities(): void {
  if (pendingActivities.length === 0) {
    return;
  }
  pendingActivities = [];
  notify();
}

export function takePendingActivities(): PendingActivity[] {
  const snapshot = pendingActivities;
  pendingActivities = [];
  notify();
  return snapshot;
}

export function subscribePendingActivities(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
