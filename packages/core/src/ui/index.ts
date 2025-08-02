import AlertModal from '@aerogel/core/components/ui/AlertModal.vue';
import ConfirmModal from '@aerogel/core/components/ui/ConfirmModal.vue';
import ErrorReportModal from '@aerogel/core/components/ui/ErrorReportModal.vue';
import LoadingModal from '@aerogel/core/components/ui/LoadingModal.vue';
import PromptModal from '@aerogel/core/components/ui/PromptModal.vue';
import StartupCrash from '@aerogel/core/components/ui/StartupCrash.vue';
import Toast from '@aerogel/core/components/ui/Toast.vue';
import { bootServices } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';

import UI from './UI';
import type { UIComponents } from './UI';
import type { Component } from 'vue';

const services = { $ui: UI };

export * from './UI';
export * from './utils';
export { default as UI } from './UI';
export { useModal } from '@noeldemartin/vue-modals';

export type UIServices = typeof services;

export default definePlugin({
    async install(app, options) {
        const components: Partial<Record<keyof UIComponents, Component>> = {
            'alert-modal': AlertModal,
            'confirm-modal': ConfirmModal,
            'error-report-modal': ErrorReportModal,
            'loading-modal': LoadingModal,
            'prompt-modal': PromptModal,
            'startup-crash': StartupCrash,
            'toast': Toast,
            ...options.components,
        };

        for (const [name, component] of Object.entries(components)) {
            UI.registerComponent(name as keyof UIComponents, component as UIComponents[keyof UIComponents]);
        }

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        components?: Partial<Partial<UIComponents>>;
    }
}

declare module '@aerogel/core/services' {
    export interface Services extends UIServices {}
}
