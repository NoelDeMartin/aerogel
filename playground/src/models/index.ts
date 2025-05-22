import type LocalTask from '@/models/LocalTask';

declare module 'soukai' {
    interface ModelsRegistry {
        LocalTask: typeof LocalTask;
    }
}
