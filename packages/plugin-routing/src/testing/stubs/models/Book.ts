import type { BelongsToManyRelation } from 'soukai-bis';

import Model from './Book.schema';
import type Chapter from './Chapter';

export default class Book extends Model {
    declare public readonly relatedChapters: BelongsToManyRelation<this, Chapter, typeof Chapter>;
}
