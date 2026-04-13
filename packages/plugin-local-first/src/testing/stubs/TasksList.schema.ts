import { contains, defineContainerSchema } from 'soukai-bis';

import Task from './Task';

export default defineContainerSchema({
    history: true,
    timestamps: true,
    tombstone: false,
    relations: {
        tasks: contains(Task),
    },
});
