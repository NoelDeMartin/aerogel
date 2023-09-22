import { defineServiceState } from '@aerogel/core';

import type OfflineTask from '@/models/OfflineTask';

export default defineServiceState({
    name: 'offline-tasks',
    persist: ['remoteContainerUrl'],
    initialState: {
        allTasks: [] as OfflineTask[],
        remoteContainerUrl: null as string | null,
    },
    computed: {
        hasRemote: ({ remoteContainerUrl }) => remoteContainerUrl !== null,
        tasks: ({ allTasks }) => allTasks.filter((task) => !task.isSoftDeleted()),
    },
});
