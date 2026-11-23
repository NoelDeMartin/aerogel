import type Gallery from './Gallery';
import type User from './User';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        Gallery: typeof Gallery;
        User: typeof User;
    }
}
