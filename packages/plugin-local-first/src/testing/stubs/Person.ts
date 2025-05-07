import type { SolidHasManyRelation } from 'soukai-solid';
import type { Relation } from 'soukai';

import Model from './Person.schema';
import Post from './Post';

export default class Person extends Model {

    public static override timestamps = false;

    declare public posts?: Post[];
    declare public relatedPosts: SolidHasManyRelation<Person, Post, typeof Post>;

    public postsRelationship(): Relation {
        return this.hasMany(Post, 'authorUrl');
    }

}
