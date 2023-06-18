import type { Component } from 'vue';

import { bootServices } from '@/services';
import { defineBootstrapHook } from '@/bootstrap/hooks';

import UI, { UIComponents } from './UI';
import AGAlertModal from '../components/modals/AGAlertModal.vue';
import type { UIComponent } from './UI';

export { UI, UIComponents, UIComponent };

const services = { $ui: UI };

export type UIServices = typeof services;

export default defineBootstrapHook(async (app, options) => {
    const defaultComponents = {
        [UIComponents.AlertModal]: AGAlertModal,
    };

    Object.entries({
        ...defaultComponents,
        ...options.components,
    }).forEach(([name, component]) => UI.registerComponent(name as UIComponent, component));

    await bootServices(app, services);
});

declare module '@/bootstrap/options' {
    interface BootstrapOptions {
        components?: Partial<Record<UIComponent, Component>>;
    }
}

declare module '@/services' {
    interface Services extends UIServices {}
}
