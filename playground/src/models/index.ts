import type LocalTask from '@/models/LocalTask';
import type SolidTask from '@/models/SolidTask';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        SolidTask: typeof SolidTask;
        LocalTask: typeof LocalTask;
    }
}
