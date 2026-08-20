import { bootstrapApplication } from '@aerogel/core';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import type { AerogelOptions } from '@aerogel/core';

export function setup(options: AerogelOptions = {}): void {
    setupStorybook(async (app) => {
        await bootstrapApplication(app, options);
    });
}
