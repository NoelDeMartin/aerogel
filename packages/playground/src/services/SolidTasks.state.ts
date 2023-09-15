import { defineServiceState } from '@aerogel/core';

export default defineServiceState({
    name: 'solid-tasks',
    initialState: {
        ready: false,
    },
});
