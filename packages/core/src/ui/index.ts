import type { Component } from 'vue';

import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import UI, { UIComponents } from './UI';
import AGAlertModal from '../components/modals/AGAlertModal.vue';
import AGConfirmModal from '../components/modals/AGConfirmModal.vue';
import AGErrorReportModal from '../components/modals/AGErrorReportModal.vue';
import AGLoadingModal from '../components/modals/AGLoadingModal.vue';
import AGSnackbar from '../components/snackbars/AGSnackbar.vue';
import type { UIComponent } from './UI';

const services = { $ui: UI };

export * from './UI';
export { default as UI } from './UI';

export type UIServices = typeof services;

export default definePlugin({
    async install(app, options) {
        const defaultComponents = {
            [UIComponents.AlertModal]: AGAlertModal,
            [UIComponents.ConfirmModal]: AGConfirmModal,
            [UIComponents.ErrorReportModal]: AGErrorReportModal,
            [UIComponents.LoadingModal]: AGLoadingModal,
            [UIComponents.Snackbar]: AGSnackbar,
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
