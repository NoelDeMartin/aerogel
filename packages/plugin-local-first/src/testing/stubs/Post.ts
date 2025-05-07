import type { Relation } from 'soukai';
import type { SolidBelongsToOneRelation } from 'soukai-solid';

import Model from './Post.schema';
import Person from './Person';

export default class Post extends Model {

    public static override timestamps = false;

    declare public author?: Person;
    declare public relatedAuthor: SolidBelongsToOneRelation<Post, Person, typeof Person>;

    public authorRelationship(): Relation {
        return this.belongsToOne(Person, 'authorUrl');
    }

}
