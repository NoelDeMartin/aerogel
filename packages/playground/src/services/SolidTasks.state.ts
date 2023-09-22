import { defineServiceState } from '@aerogel/core';
import { PromisedValue } from '@noeldemartin/utils';
import type { SolidContainer } from 'soukai-solid';

export default defineServiceState({
    name: 'solid-tasks',
    initialState: {
        tasksContainer: new PromisedValue<SolidContainer>(),
    },
    computed: {
        ready: ({ tasksContainer }) => tasksContainer.isResolved(),
    },
});
