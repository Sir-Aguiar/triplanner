import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, readonly, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

import type Activity from './Activity';

export default class Category extends Model {
  static table = 'categories';

  static associations: Associations = {
    activities: { type: 'has_many', foreignKey: 'category_id' },
  };

  @text('name') name: string;
  @text('icon') icon: string | null;
  @text('color') color: string | null;
  @readonly @date('created_at') createdAt: Date;
  @readonly @date('updated_at') updatedAt: Date;

  @children('activities') activities: Query<Activity>;
}
