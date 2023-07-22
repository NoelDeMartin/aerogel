import i18n from '@aerogel/plugin-i18n';
import { defineSetupVue3 } from '@histoire/plugin-vue';

import './assets/styles.css';
import StateVariants from '@/histoire/StateVariants.vue';

export const setupVue3 = defineSetupVue3(async ({ app }) => {
    const plugin = i18n({ messages: import.meta.glob('@/lang/*.yaml') });

    await plugin.install(app, {});

    app.component('StateVariants', StateVariants);
});