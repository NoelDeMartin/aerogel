import { defineServiceState } from '@aerogel/core';

import type OfflineTask from '@/models/OfflineTask';

export default defineServiceState({
    name: 'offline-tasks',
    initialState: {
        allTasks: [] as OfflineTask[],
    },
    computed: {
        tasks: ({ allTasks }) => allTasks.filter((task) => !task.isSoftDeleted()),
    },
});
