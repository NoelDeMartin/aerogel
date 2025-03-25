import Aerogel from 'virtual:aerogel';

import { createApp } from 'vue';
import type { App as AppInstance, Component } from 'vue';

import App from '@aerogel/core/services/App';
import directives from '@aerogel/core/directives';
import errors from '@aerogel/core/errors';
import Events from '@aerogel/core/services/Events';
import lang from '@aerogel/core/lang';
import services from '@aerogel/core/services';
import testing from '@aerogel/core/testing';
import ui from '@aerogel/core/ui';
import { installPlugins } from '@aerogel/core/plugins';
import type { AerogelOptions } from '@aerogel/core/bootstrap/options';

export type { AerogelOptions };

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

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        'application-ready': void;
        'application-mounted': void;
    }
}
