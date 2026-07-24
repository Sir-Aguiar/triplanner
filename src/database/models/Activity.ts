import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

import type Category from './Category';
import type Trip from './Trip';

export default class Activity extends Model {
  static table = 'activities';

  static associations: Associations = {
    trips: { type: 'belongs_to', key: 'trip_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
  };

  @relation('trips', 'trip_id') trip: Relation<Trip>;
  @relation('categories', 'category_id') category: Relation<Category>;

  @text('title') title: string;
  @text('notes') notes: string | null;
  /** ISO 8601 UTC (string de negócio) */
  @text('start_time') startTime: string;
  /** ISO 8601 UTC (string de negócio) */
  @text('end_time') endTime: string;
  @field('cost') cost: number;
  @field('is_per_person') isPerPerson: boolean;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;
}
