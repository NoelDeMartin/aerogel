import i18n from '@aerogel/plugin-i18n';
import { defineSetupVue3 } from '@histoire/plugin-vue';
import { monkeyPatch, stringToSlug } from '@noeldemartin/utils';

import AlertModal from './components/modals/AlertModal.vue';
import StoryPage from './histoire/components/StoryPage.vue';
import StoryPlaceholder from './histoire/components/StoryPlaceholder.vue';

import './assets/styles.css';
import './assets/histoire.css';
import { UI, UIComponents } from '@aerogel/core';

export const setupVue3 = defineSetupVue3(async ({ app, story, variant }) => {
    const plugins = [i18n({ messages: import.meta.glob('@/lang/*.yaml') })];
    const services = { $ui: UI };
    const components = { StoryPage, StoryPlaceholder };

    await Promise.all(Object.values(services).map((service) => service.launch()));
    await Promise.all(plugins.map((plugin) => plugin.install(app, {})));

    Object.assign(app.config.globalProperties, services);
    Object.entries(components).forEach(([name, component]) => app.component(name, component));

    UI.registerComponent(UIComponents.AlertModal, AlertModal);

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
});
