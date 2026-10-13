import type { ComputedAttribute } from 'soukai-bis';

import Model from './Post.schema';

export default class Post extends Model {
    public static override computed = {
        titleLength: (post: Post): number => post.title.length,
    };

    declare public readonly titleLength: ComputedAttribute<number>;
}
