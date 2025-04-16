import { defineServiceState } from '@aerogel/core';

import type LocalTask from '@/models/LocalTask';

export default defineServiceState({
    name: 'local-tasks',
    initialState: {
        _all: [] as LocalTask[],
    },
    computed: {
        all: ({ _all }) => _all.filter((task) => !task.isSoftDeleted()),
    },
});
