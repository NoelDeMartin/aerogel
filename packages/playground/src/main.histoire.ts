import i18n from '@aerogel/plugin-i18n';
import { defineSetupVue3 } from '@histoire/plugin-vue';
import { monkeyPatch, stringToSlug } from '@noeldemartin/utils';

import StoryPage from './histoire/components/StoryPage.vue';
import StoryPlaceholder from './histoire/components/StoryPlaceholder.vue';

import './assets/styles.css';

export const setupVue3 = defineSetupVue3(async ({ app, story, variant }) => {
    const plugins = [i18n({ messages: import.meta.glob('@/lang/*.yaml') })];
    const components = { StoryPage, StoryPlaceholder };

    await Promise.all(plugins.map((plugin) => plugin.install(app, {})));

    Object.entries(components).forEach(([name, component]) => app.component(name, component));

    monkeyPatch(app, 'mount', (el: HTMLElement) => {
        const variantEl = el.parentElement?.parentElement?.parentElement?.parentElement;
        const storyEl = variantEl?.parentElement;

        if (story && storyEl) {
            Array.from(storyEl.classList)
                .filter((className) => className.startsWith('story-'))
                .forEach((className) => storyEl.classList.remove(className));

            storyEl.classList.add(`story-${stringToSlug(story.title)}`);
        }

        if (variant && variantEl) {
            Array.from(variantEl.classList)
                .filter((className) => className.startsWith('variant-'))
                .forEach((className) => variantEl.classList.remove(className));

            variantEl.classList.add(`variant-${stringToSlug(variant.title)}`);
        }
    });
});
