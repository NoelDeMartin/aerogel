import type { HasManyRelation } from 'soukai-bis';

import Model from './Person.schema';
import type Post from './Post';

export default class Person extends Model {

    declare public posts?: Post[];
    declare public relatedPosts: HasManyRelation<Person, Post, typeof Post>;

}
