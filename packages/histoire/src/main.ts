import { bootstrapApplication } from '@aerogel/core';
import { defineSetupVue3 } from '@histoire/plugin-vue';
import { monkeyPatch, stringToSlug } from '@noeldemartin/utils';
import type { AerogelOptions } from '@aerogel/core';
import type { Vue3StorySetupHandler } from '@histoire/plugin-vue';

import components from './components';

export type Options = Pick<AerogelOptions, 'components' | 'plugins'> & {
    messages?: Record<string, unknown>;
    setup?: Vue3StorySetupHandler;
};

export function defineSetupAerogel(options: Options): Vue3StorySetupHandler {
    return defineSetupVue3(async (histoireOptions) => {
        const { app, story, variant } = histoireOptions;
        const { messages, setup, ...aerogelOptions } = options;

        aerogelOptions.plugins ??= [];

        if (messages) {
            const { default: i18n } = await import('@aerogel/plugin-i18n');

            aerogelOptions.plugins.push(i18n({ messages }));
        }

        await bootstrapApplication(app, aerogelOptions);

        Object.entries(components).forEach(([name, component]) => app.component(name, component));

        monkeyPatch(app, 'mount', (el: HTMLElement) => {
            const variantEl = el.parentElement?.parentElement?.parentElement?.parentElement;
            const storyEl = variantEl?.parentElement;

            if (story && storyEl) {
                Array.from(storyEl.classList)
                    .filter((className) => className.startsWith('story-'))
                    .forEach((className) => storyEl.classList.remove(className));

                storyEl.classList.add('story');
                storyEl.classList.add(`story-${stringToSlug(story.title)}`);
            }

            if (variant && variantEl) {
                Array.from(variantEl.classList)
                    .filter((className) => className.startsWith('variant-'))
                    .forEach((className) => variantEl.classList.remove(className));

                variantEl.classList.add('variant');
                variantEl.classList.add(`variant-${stringToSlug(variant.title)}`);
            }
        });

        await setup?.(histoireOptions);
    });
}
