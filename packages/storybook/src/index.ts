import { AppLayout, bootstrapApplication } from '@aerogel/core';
import { bootCoreModels } from 'soukai-bis';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import type { AerogelApp } from '@aerogel/core';

export const decorators = [
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
