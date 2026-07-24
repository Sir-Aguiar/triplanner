import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import type { ActivityListItem } from '@/components/trips/activity-timeline';
import { getDatabase } from '@/database';
import type Activity from '@/database/models/Activity';
import type Category from '@/database/models/Category';

export function useTripActivities(tripId?: string): {
  activities: ActivityListItem[];
  loading: boolean;
} {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));

  useEffect(() => {
    if (!tripId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const database = getDatabase();
    const subscription = database
      .get<Activity>('activities')
      .query(Q.where('trip_id', tripId), Q.sortBy('start_time', Q.asc))
      .observe()
      .subscribe({
        next: async (records) => {
          const items = await Promise.all(
            records.map(async (activity) => {
              let categoryName: string | undefined;
              let categoryColor: string | null | undefined;

              try {
                const category = await activity.category.fetch();
                categoryName = category?.name;
                categoryColor = category?.color;
              } catch {
                categoryName = undefined;
                categoryColor = undefined;
              }

              return {
                id: activity.id,
                title: activity.title,
                startTime: activity.startTime,
                endTime: activity.endTime,
                cost: activity.cost,
                isPerPerson: activity.isPerPerson,
                categoryName,
                categoryColor,
                notes: activity.notes,
              } satisfies ActivityListItem;
            }),
          );

          setActivities(items);
          setLoading(false);
        },
        error: () => {
          setActivities([]);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, [tripId]);

  return { activities, loading };
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
        categoryName: category?.name,
        categoryColor: category?.color,
        notes: item.notes,
      };
    });
}
