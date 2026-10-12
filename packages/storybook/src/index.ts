import { AppLayout, Events, bootstrapApplication, resetPiniaStore } from '@aerogel/core';
import type { AerogelApp } from '@aerogel/core';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import { bootCoreModels } from 'soukai-bis';

export * from './components';

globalThis.__aerogelStorybook__ = true;

export const decorators = [
    // oxlint-disable-next-line typescript/explicit-module-boundary-types
    () => ({
        components: { AppLayout },
        template: '<AppLayout><story/></AppLayout>',
    }),
];

export function setup(aerogelInstance: AerogelApp): void {
    setupStorybook(async (vueInstance) => {
        resetPiniaStore();
        bootCoreModels({ reset: true });

        await bootstrapApplication(vueInstance, aerogelInstance.options);
        await Events.emit('application-mounted');
    });
}
