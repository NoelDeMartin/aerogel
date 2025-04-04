import type { Component } from 'vue';

import AGSnackbar from '@aerogel/core/components/snackbars/AGSnackbar.vue';
import AGStartupCrash from '@aerogel/core/components/lib/AGStartupCrash.vue';
import AlertModal from '@aerogel/core/components/ui/AlertModal.vue';
import ConfirmModal from '@aerogel/core/components/ui/ConfirmModal.vue';
import ErrorReportModal from '@aerogel/core/components/ui/ErrorReportModal.vue';
import LoadingModal from '@aerogel/core/components/ui/LoadingModal.vue';
import PromptModal from '@aerogel/core/components/ui/PromptModal.vue';
import { bootServices } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';

import UI, { UIComponents } from './UI';
import type { UIComponent } from './UI';

const services = { $ui: UI };

export * from './UI';
export * from './utils';
export { default as UI } from './UI';

export type UIServices = typeof services;

export default definePlugin({
    async install(app, options) {
        const defaultComponents = {
            [UIComponents.AlertModal]: AlertModal,
            [UIComponents.ConfirmModal]: ConfirmModal,
            [UIComponents.ErrorReportModal]: ErrorReportModal,
            [UIComponents.LoadingModal]: LoadingModal,
            [UIComponents.PromptModal]: PromptModal,
            [UIComponents.Snackbar]: AGSnackbar,
            [UIComponents.StartupCrash]: AGStartupCrash,
        };

        Object.entries({
            ...defaultComponents,
            ...options.components,
        }).forEach(([name, component]) => UI.registerComponent(name as UIComponent, component));

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        components?: Partial<Record<UIComponent, Component>>;
    }
}

declare module '@aerogel/core/services' {
    export interface Services extends UIServices {}
}
