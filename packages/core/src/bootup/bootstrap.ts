import { createApp } from 'vue';
import { IndexedDBEngine, bootModelsFromViteGlob, setEngine } from 'soukai';
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import directives from '@/directives';
import { UI, UIComponents, bootServices } from '@/services';
import { createAppI18n } from '@/lang';
import { createAppRouter } from '@/routing';
import type { UIComponent } from '@/services';
import type { LangOptions } from '@/lang';

import AGAlertModal from '../components/modals/AGAlertModal.vue';

function bootModels(models: Record<string, Record<string, unknown>>) {
    setEngine(new IndexedDBEngine());
    bootModelsFromViteGlob(models);
}

function getLangOptions(options: BootstrapOptions): LangOptions | null {
    if (options.lang) {
        return options.lang;
    }

    if (options.langMessages) {
        return { messages: options.langMessages };
    }

    return null;
}

function registerComponents(options: BootstrapOptions): void {
    const components = {
        [UIComponents.AlertModal]: AGAlertModal,
        ...options.components,
    };

    Object.entries(components).forEach(([name, component]) => UI.registerComponent(name as UIComponent, component));
}

export interface BootstrapOptions {
    lang?: LangOptions;
    langMessages?: LangOptions['messages'];
    routes?: RouteRecordRaw[];
    models?: Record<string, Record<string, unknown>>;
    components?: Partial<Record<UIComponent, Component>>;
}

export async function bootstrapApplication(rootComponent: Component, options: BootstrapOptions = {}): Promise<void> {
    const app = createApp(rootComponent);
    const langOptions = getLangOptions(options);
    const services = await bootServices();

    Object.assign(app.config.globalProperties, services);
    Object.entries(directives).forEach(([name, directive]) => app.directive(name, directive));
    langOptions && app.use(await createAppI18n(langOptions));
    options.routes && app.use(createAppRouter({ routes: options.routes }));
    options.models && bootModels(options.models);
    registerComponents(options);

    app.mount('#app');
}
