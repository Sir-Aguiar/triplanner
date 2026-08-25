import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage-state';

function createPendingIdStore(storageKey: string) {
  let memoryIds: Set<string> | null = null;
  let loadPromise: Promise<Set<string>> | null = null;

  async function readStoredIds(): Promise<Set<string>> {
    const raw = await getStorageItemAsync(storageKey);
    if (!raw) {
      return new Set();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return new Set();
      }

      return new Set(
        parsed.filter((item): item is string => typeof item === 'string' && item.length > 0),
      );
    } catch {
      return new Set();
    }
  }

  async function persist(ids: Set<string>): Promise<void> {
    if (ids.size === 0) {
      await setStorageItemAsync(storageKey, null);
      return;
    }

    await setStorageItemAsync(storageKey, JSON.stringify([...ids]));
  }

  async function loadIds(): Promise<Set<string>> {
    if (memoryIds) {
      return memoryIds;
    }

    if (!loadPromise) {
      loadPromise = readStoredIds().then((ids) => {
        memoryIds = ids;
        return ids;
      });
    }

    return loadPromise;
  }

  return {
    async getAll(): Promise<string[]> {
      const ids = await loadIds();
      return [...ids];
    },
    async add(id: string): Promise<void> {
      const ids = await loadIds();
      if (ids.has(id)) {
        return;
      }

      ids.add(id);
      await persist(ids);
    },
    async remove(id: string): Promise<void> {
      const ids = await loadIds();
      if (!ids.delete(id)) {
        return;
      }

      await persist(ids);
    },
  };
}

const pendingTripDeletes = createPendingIdStore('triplanner.pendingTripDeletes');
const pendingActivityDeletes = createPendingIdStore('triplanner.pendingActivityDeletes');

export const getPendingTripDeletes = pendingTripDeletes.getAll;
export const addPendingTripDelete = pendingTripDeletes.add;
export const removePendingTripDelete = pendingTripDeletes.remove;

export const getPendingActivityDeletes = pendingActivityDeletes.getAll;
export const addPendingActivityDelete = pendingActivityDeletes.add;
export const removePendingActivityDelete = pendingActivityDeletes.remove;
