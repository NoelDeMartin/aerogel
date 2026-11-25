import { AppLayout, Events, bootstrapApplication, resetPiniaStore } from '@aerogel/core';
import type { AerogelApp } from '@aerogel/core';
import { FakeSolidEngine } from '@aerogel/plugin-solid';
import { setup as setupStorybook } from '@storybook/vue3-vite';
import type { Decorator, Preview } from '@storybook/vue3-vite';
import { bootCoreModels, setRemoteEngine } from 'soukai-bis';

export * from './components';
export * from './lib';

globalThis.__aerogelStorybook__ = true;

export const decorators: Decorator[] = [
    () => ({
        components: { AppLayout },
        template: '<AppLayout><story/></AppLayout>',
    }),
    (story, { globals }) => {
        document.documentElement.classList.toggle('dark', globals.theme === 'dark');

        return story();
    },
];

export const globalTypes: NonNullable<Preview['globalTypes']> = {
    theme: {
        description: 'Color scheme',
        toolbar: {
            dynamicTitle: true,
            items: [
                { value: 'light', title: 'Light mode', icon: 'sun' },
                { value: 'dark', title: 'Dark mode', icon: 'moon' },
            ],
        },
    },
};

export const initialGlobals: NonNullable<Preview['initialGlobals']> = {
    theme: 'light',
};

export const preview: Pick<Preview, 'decorators' | 'globalTypes' | 'initialGlobals'> = {
    decorators,
    globalTypes,
    initialGlobals,
};

export function setup(aerogelInstance: AerogelApp): void {
    setupStorybook(async (vueInstance) => {
        resetPiniaStore();
        bootCoreModels({ reset: true });
        setRemoteEngine(new FakeSolidEngine());

        await bootstrapApplication(vueInstance, aerogelInstance.options);
        await Events.emit('application-mounted');
    });
}
