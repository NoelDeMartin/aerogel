import type Book from './Book';
import type Chapter from './Chapter';
import type Item from './Item';
import type Post from './Post';
import type Shelf from './Shelf';
import type Task from './Task';
import type User from './User';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        Book: typeof Book;
        Chapter: typeof Chapter;
        Item: typeof Item;
        Post: typeof Post;
        Shelf: typeof Shelf;
        Task: typeof Task;
        User: typeof User;
    }
}
