import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

import type Activity from './Activity';

export default class Trip extends Model {
  static table = 'trips';

  static associations: Associations = {
    activities: { type: 'has_many', foreignKey: 'trip_id' },
  };

  @text('title') title: string;
  @text('description') description: string;
  @field('travelers') travelers: number;
  /** ISO 8601 UTC (string de negócio) */
  @text('start_date') startDate: string;
  /** ISO 8601 UTC (string de negócio) */
  @text('end_date') endDate: string;
  @text('cover_image') coverImage: string;
  @field('total_budget') totalBudget: number;
  @field('is_public') isPublic: boolean;
  /** ID do usuário autenticado; `null` em modo convidado. */
  @text('user_id') userId: string | null;
  /** Preenchido automaticamente pelo WatermelonDB em create (não setar manualmente). */
  @readonly @date('created_at') createdAt: Date;
  /** Atualizado automaticamente pelo WatermelonDB em todo `.update()` (LWW / RN01). */
  @readonly @date('updated_at') updatedAt: Date;

  @children('activities') activities: Query<Activity>;
}
