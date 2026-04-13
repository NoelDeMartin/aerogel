import { defineServiceState } from '@aerogel/core';
import { PromisedValue } from '@noeldemartin/utils';
import type { Container } from 'soukai-bis';

export default defineServiceState({
    name: 'solid-tasks',
    initialState: () => ({
        tasksContainer: new PromisedValue<Container>(),
    }),
    computed: {
        ready: ({ tasksContainer }) => tasksContainer.isResolved(),
    },
});
