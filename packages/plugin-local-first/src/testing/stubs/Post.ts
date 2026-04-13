import type { BelongsToOneRelation } from 'soukai-bis';

import Model from './Post.schema';
import type Person from './Person';

export default class Post extends Model {

    declare public author?: Person;
    declare public relatedAuthor: BelongsToOneRelation<Post, Person, typeof Person>;

}
