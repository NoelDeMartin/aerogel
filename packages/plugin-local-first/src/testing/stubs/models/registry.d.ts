import type Post from './Post';
import type PostsCollection from './PostsCollection';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        Post: typeof Post;
        PostsCollection: typeof PostsCollection;
    }
}
