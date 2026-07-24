import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import type { ActivityListItem } from '@/components/trips/activity-timeline';
import { getDatabase } from '@/database';
import type Activity from '@/database/models/Activity';
import type Category from '@/database/models/Category';
import type Trip from '@/database/models/Trip';
import { resolveActivityTotalCost, sumActivityCostsPerPerson } from '@/utils/budget';

const ACTIVITY_OBSERVED_COLUMNS = [
  'title',
  'notes',
  'start_time',
  'end_time',
  'cost',
  'is_per_person',
  'category_id',
] as const;

async function mapActivities(
  records: Activity[],
  travelers: number,
): Promise<ActivityListItem[]> {
  return Promise.all(
    records.map(async (activity) => {
      let categoryName: string | undefined;
      let categoryColor: string | null | undefined;
      let categoryIcon: string | null | undefined;
      let categoryId: string | undefined;

      try {
        const category = await activity.category.fetch();
        categoryName = category?.name;
        categoryColor = category?.color;
        categoryIcon = category?.icon;
        categoryId = category?.id;
      } catch {
        categoryName = undefined;
        categoryColor = undefined;
        categoryIcon = undefined;
        categoryId = (activity._raw as unknown as { category_id?: string }).category_id;
      }

      const effectiveCost = resolveActivityTotalCost(activity, travelers);

      return {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        endTime: activity.endTime,
        cost: activity.cost,
        isPerPerson: activity.isPerPerson,
        categoryId,
        categoryName,
        categoryColor,
        categoryIcon,
        notes: activity.notes,
        effectiveCost,
      } satisfies ActivityListItem;
    }),
  );
}

export function useTripActivities(tripId?: string): {
  activities: ActivityListItem[];
  loading: boolean;
  spentTotal: number;
  costPerPerson: number;
} {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [spentTotal, setSpentTotal] = useState(0);
  const [costPerPerson, setCostPerPerson] = useState(0);
  const [loading, setLoading] = useState(Boolean(tripId));

  useEffect(() => {
    if (!tripId) {
      setActivities([]);
      setSpentTotal(0);
      setCostPerPerson(0);
      setLoading(false);
      return;
    }

    const database = getDatabase();
    let travelers = 1;
    let activityRecords: Activity[] = [];
    let cancelled = false;

    const publish = async () => {
      try {
        const items = await mapActivities(activityRecords, travelers);
        if (cancelled) {
          return;
        }

        setActivities(items);
        setSpentTotal(items.reduce((sum, item) => sum + (item.effectiveCost ?? 0), 0));
        setCostPerPerson(sumActivityCostsPerPerson(items, travelers));
        setLoading(false);
      } catch {
        if (cancelled) {
          return;
        }
        setActivities([]);
        setSpentTotal(0);
        setCostPerPerson(0);
        setLoading(false);
      }
    };

    // Viajantes afetam custo efetivo / por pessoa mesmo sem mudar atividades.
    const tripSubscription = database
      .get<Trip>('trips')
      .findAndObserve(tripId)
      .subscribe({
        next: (trip) => {
          travelers = trip.travelers;
          void publish();
        },
        error: () => {
          travelers = 1;
          void publish();
        },
      });

    // observe() NÃO emite updates de campos — só add/remove. Usar observeWithColumns.
    const activitiesSubscription = database
      .get<Activity>('activities')
      .query(Q.where('trip_id', tripId), Q.sortBy('start_time', Q.asc))
      .observeWithColumns([...ACTIVITY_OBSERVED_COLUMNS])
      .subscribe({
        next: (records) => {
          activityRecords = records;
          void publish();
        },
        error: () => {
          if (cancelled) {
            return;
          }
          setActivities([]);
          setSpentTotal(0);
          setCostPerPerson(0);
          setLoading(false);
        },
      });

    return () => {
      cancelled = true;
      tripSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
    };
  }, [tripId]);

  return { activities, loading, spentTotal, costPerPerson };
}

/** Resolve nomes de categorias para itens pendentes (cache). */
export async function mapPendingWithCategories(
  pending: Array<{
    tempId: string;
    title: string;
    startTime: string;
    endTime: string;
    cost: number;
    isPerPerson: boolean;
    categoryId: string;
    notes: string;
  }>,
): Promise<ActivityListItem[]> {
  const database = getDatabase();
  const categories = await database.get<Category>('categories').query().fetch();
  const byId = new Map(categories.map((category) => [category.id, category]));

  return [...pending]
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    .map((item) => {
      const category = byId.get(item.categoryId);
      return {
        id: item.tempId,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime || item.startTime,
        cost: item.cost,
        isPerPerson: item.isPerPerson,
        categoryId: item.categoryId,
        categoryName: category?.name,
        categoryColor: category?.color,
        categoryIcon: category?.icon,
        notes: item.notes,
      };
    });
}
