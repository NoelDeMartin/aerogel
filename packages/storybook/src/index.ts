import { AppLayout, bootstrapApplication } from '@aerogel/core';
import type { AerogelApp } from '@aerogel/core';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import { bootCoreModels } from 'soukai-bis';

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
        bootCoreModels({ reset: true });

        await bootstrapApplication(vueInstance, aerogelInstance.options);
    });
}
