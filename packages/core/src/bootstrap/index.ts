import Aerogel from 'virtual:aerogel';

import { createApp } from 'vue';
import type { App as AppInstance, Component } from 'vue';

import App from '@/services/App';
import directives from '@/directives';
import errors from '@/errors';
import Events from '@/services/Events';
import lang from '@/lang';
import services from '@/services';
import testing from '@/testing';
import ui from '@/ui';
import { installPlugins } from '@/plugins';
import type { AerogelOptions } from '@/bootstrap/options';

export { AerogelOptions };

export async function bootstrapApplication(app: AppInstance, options: AerogelOptions = {}): Promise<void> {
    const plugins = [testing, directives, errors, lang, services, ui, ...(options.plugins ?? [])];

    App.instance = app;

    await installPlugins(plugins, app, options);
    await options.install?.(app);
    await Events.emit('application-ready');
}

export async function bootstrap(rootComponent: Component, options: AerogelOptions = {}): Promise<void> {
    const app = createApp(rootComponent);

    if (Aerogel.environment === 'development') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).$aerogel = app;
    }

    await bootstrapApplication(app, options);

    app.mount('#app');
    app._container?.classList.remove('loading');

    await Events.emit('application-mounted');
}

declare module '@/services/Events' {
    export interface EventsPayload {
        'application-ready': void;
        'application-mounted': void;
    }
}
