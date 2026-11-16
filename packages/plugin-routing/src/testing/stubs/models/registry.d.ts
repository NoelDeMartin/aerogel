import type Book from './Book';
import type Chapter from './Chapter';
import type Post from './Post';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        Book: typeof Book;
        Chapter: typeof Chapter;
        Post: typeof Post;
    }
}
