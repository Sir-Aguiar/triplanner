import { useSyncExternalStore } from 'react';

import {
  getPendingActivities,
  subscribePendingActivities,
  type PendingActivity,
} from '@/stores/pending-activities';

export function usePendingActivities(): PendingActivity[] {
  return useSyncExternalStore(subscribePendingActivities, getPendingActivities, getPendingActivities);
}
