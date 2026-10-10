import { AppLayout, Events, appNamespace, bootstrapApplication } from '@aerogel/core';
import type { AerogelApp } from '@aerogel/core';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import { bootCoreModels } from 'soukai-bis';

export * from './modals';
export * from './services';

globalThis.__aerogelStorybook__ = true;

// This module is imported before the app is bootstrapped, so clearing the state here makes sure that it's never
// restored when services are booted for the first time.
clearPersistedState();

export const decorators = [
    // oxlint-disable-next-line typescript/explicit-module-boundary-types
    () => ({
        components: { AppLayout },
        template: '<AppLayout><story/></AppLayout>',
    }),
];

export function setup(aerogelInstance: AerogelApp): void {
    setupStorybook(async (vueInstance) => {
        clearPersistedState();
        bootCoreModels({ reset: true });

        await bootstrapApplication(vueInstance, aerogelInstance.options);

        // Stories are mounted by Storybook, so the app is considered mounted from now on (otherwise, errors would be
        // treated as startup errors). This is emitted before mounting the story to avoid running startup hooks (such
        // as Cloud synchronization) on top of the state faked by stories.
        await Events.emit('application-mounted');
    });
}

function clearPersistedState(): void {
    // Stories can override service state, so it's cleared before booting services to make sure that each story starts
    // from a clean slate (and to avoid side-effects such as reconnecting to a fake Solid session on startup).
    const prefix = `${appNamespace()}:`;

    Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => localStorage.removeItem(key));
}
