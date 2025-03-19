import type { Component } from 'vue';

import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import UI, { UIComponents } from './UI';
import AGAlertModal from '../components/modals/AGAlertModal.vue';
import AGConfirmModal from '../components/modals/AGConfirmModal.vue';
import AGErrorReportModal from '../components/modals/AGErrorReportModal.vue';
import AGLoadingModal from '../components/modals/AGLoadingModal.vue';
import AGPromptModal from '../components/modals/AGPromptModal.vue';
import AGSnackbar from '../components/snackbars/AGSnackbar.vue';
import AGStartupCrash from '../components/lib/AGStartupCrash.vue';
import type { UIComponent } from './UI';

const services = { $ui: UI };

export * from './UI';
export * from './UI.state';
export * from './utils';
export { default as UI } from './UI';

export type UIServices = typeof services;

export default definePlugin({
    async install(app, options) {
        const defaultComponents = {
            [UIComponents.AlertModal]: AGAlertModal,
            [UIComponents.ConfirmModal]: AGConfirmModal,
            [UIComponents.ErrorReportModal]: AGErrorReportModal,
            [UIComponents.LoadingModal]: AGLoadingModal,
            [UIComponents.PromptModal]: AGPromptModal,
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

declare module '@/bootstrap/options' {
    export interface AerogelOptions {
        components?: Partial<Record<UIComponent, Component>>;
    }
}

declare module '@/services' {
    export interface Services extends UIServices {}
}
