import { AppLayout, Events, appNamespace, bootstrapApplication, resetPiniaStore } from '@aerogel/core';
import type { AerogelApp } from '@aerogel/core';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import { bootCoreModels } from 'soukai-bis';
import type { App } from 'vue';

import type { ServiceFake } from './fakes';

export * from './components';
export * from './fakes';

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
    setupStorybook(async (vueInstance, storyContext) => {
        clearPersistedState();
        bootCoreModels({ reset: true });
        installServiceFakes(vueInstance, (storyContext?.parameters.fakes as ServiceFake[] | undefined) ?? []);

        await bootstrapApplication(vueInstance, aerogelInstance.options);

        // Stories are mounted by Storybook, so the app is considered mounted from now on (otherwise, errors would be
        // treated as startup errors). This is emitted before mounting the story to avoid running startup hooks on top
        // of the state set up by stories.
        await Events.emit('application-mounted');
    });
}

function installServiceFakes(app: App, fakes: ServiceFake[]): void {
    if (fakes.length === 0) {
        return;
    }

    // Service stores are identified by name, so fakes would share the state of the services they replace unless the
    // store is reset before instantiating them.
    resetPiniaStore();

    const restoreCallbacks = fakes.map((fake) => fake.install());

    app.onUnmount(() => restoreCallbacks.forEach((restore) => restore()));
}

function clearPersistedState(): void {
    // Fakes use the same storage keys as the services they replace, so persisted state is cleared before booting
    // services to make sure that each story starts from a clean slate (and to avoid side-effects such as reconnecting
    // to a fake Solid session on startup).
    const prefix = `${appNamespace()}:`;

    Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => localStorage.removeItem(key));
}
