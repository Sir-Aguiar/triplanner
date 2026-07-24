import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v3: created_at/updated_at voltam a number (exigência do WatermelonDB).
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
  ],
});
