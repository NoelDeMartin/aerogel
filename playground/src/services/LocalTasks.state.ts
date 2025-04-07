import { defineServiceState } from '@aerogel/core';

import type LocalTask from '@/models/LocalTask';
import type { Nullable } from '@noeldemartin/utils';

export default defineServiceState({
    name: 'local-tasks',
    persist: ['tasksContainerUrl'],
    initialState: {
        _all: [] as LocalTask[],
        tasksContainerUrl: null as Nullable<string>,
    },
    computed: {
        all: ({ _all }) => _all.filter((task) => !task.isSoftDeleted()),
    },
});
