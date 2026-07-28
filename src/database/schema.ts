import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB exige created_at/updated_at como number (ms UTC).
 * Na camada de app, convertemos para ISO 8601 via helpers (RN03).
 * Datas de negócio (start_date, etc.) ficam como string ISO.
 * Chaves (id, trip_id, category_id) são UUID v4 em string.
 */
export const schema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: 'trips',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'travelers', type: 'number' },
        { name: 'start_date', type: 'string' },
        { name: 'end_date', type: 'string' },
        { name: 'cover_image', type: 'string' },
        { name: 'total_budget', type: 'number' },
        { name: 'is_public', type: 'boolean' },
        /** Dono autenticado; `null` enquanto convidado (órfã até o claim no login). */
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'activities',
      columns: [
        { name: 'trip_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'start_time', type: 'string' },
        { name: 'end_time', type: 'string' },
        { name: 'cost', type: 'number' },
        { name: 'is_per_person', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
