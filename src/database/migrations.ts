import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v3: created_at/updated_at voltam a number (exigência do WatermelonDB).
 * v4: trips.user_id opcional para ownership local (RF04 / merge pós-login).
 * Em incompatibilidade, `initializeDatabase` faz reset seguro.
 */
export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [],
    },
    {
      toVersion: 3,
      steps: [],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'trips',
          columns: [{ name: 'user_id', type: 'string', isOptional: true, isIndexed: true }],
        }),
      ],
    },
  ],
});
