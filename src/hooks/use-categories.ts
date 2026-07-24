import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import { getDatabase } from '@/database';
import type Category from '@/database/models/Category';

export type CategoryListItem = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

export function useCategories(): {
  categories: CategoryListItem[];
  loading: boolean;
} {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const database = getDatabase();
    const subscription = database
      .get<Category>('categories')
      .query(Q.sortBy('name', Q.asc))
      .observe()
      .subscribe({
        next: (records) => {
          setCategories(
            records.map((category) => ({
              id: category.id,
              name: category.name,
              color: category.color,
              icon: category.icon,
            })),
          );
          setLoading(false);
        },
        error: () => {
          setCategories([]);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  return { categories, loading };
}
