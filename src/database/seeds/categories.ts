import type { ICategory } from '@/@types/Category';
import { COLORS } from '@/constants/theme';
import { getDatabase } from '@/database/client';
import type Category from '@/database/models/Category';

export const CATEGORY_SEED: ICategory[] = [
  {
    categoryId: '1a2b3c4d-0001-4000-8000-000000000001',
    name: 'Hospedagem',
    icon: 'hotel',
    color: COLORS.primary,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0002-4000-8000-000000000002',
    name: 'Alimentação',
    icon: 'restaurant',
    color: COLORS.accent,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0003-4000-8000-000000000003',
    name: 'Transporte',
    icon: 'directions-car',
    color: COLORS.secondary,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0004-4000-8000-000000000004',
    name: 'Voo',
    icon: 'flight',
    color: COLORS.info,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0005-4000-8000-000000000005',
    name: 'Passeio',
    icon: 'camera-alt',
    color: COLORS.success,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0006-4000-8000-000000000006',
    name: 'Compras',
    icon: 'shopping-bag',
    color: COLORS.error,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0007-4000-8000-000000000007',
    name: 'Documentos',
    icon: 'description',
    color: COLORS.warning,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
  {
    categoryId: '1a2b3c4d-0008-4000-8000-000000000008',
    name: 'Outros',
    icon: 'more-horiz',
    color: COLORS.textSecondary,
    createdAt: '2026-07-24T14:18:00.000Z',
    updatedAt: '2026-07-24T14:18:00.000Z',
  },
];

export async function seedCategories(): Promise<void> {
  const database = getDatabase();
  const collection = database.get<Category>('categories');
  const existing = await collection.query().fetch();
  const existingIds = new Set(existing.map((category) => category.id));

  const missing = CATEGORY_SEED.filter((category) => !existingIds.has(category.categoryId));
  if (missing.length === 0) {
    return;
  }

  await database.write(async () => {
    await database.batch(
      ...missing.map((category) =>
        collection.prepareCreateFromDirtyRaw({
          id: category.categoryId,
          name: category.name,
          icon: category.icon ?? null,
          color: category.color ?? null,
          created_at: Date.parse(category.createdAt),
          updated_at: Date.parse(category.updatedAt),
        }),
      ),
    );
  });
}
