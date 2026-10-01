import type { AerogelOptions } from '@aerogel/core/bootstrap/options';
import directives from '@aerogel/core/directives';
import errors from '@aerogel/core/errors';
import { queueStartupError } from '@aerogel/core/errors/internal';
import lang from '@aerogel/core/lang';
import { installPlugins } from '@aerogel/core/plugins';
import services from '@aerogel/core/services';
import App from '@aerogel/core/services/App';
import Events from '@aerogel/core/services/Events';
import testing from '@aerogel/core/testing';
import ui from '@aerogel/core/ui';
import { setupEnv } from '@aerogel/core/utils/env';
import { isDevelopment } from '@noeldemartin/utils';
import { createApp } from 'vue';
import type { App as AppInstance, Component } from 'vue';

export type { AerogelOptions };

export interface AerogelApp {
    app: AppInstance;
    options: AerogelOptions;
}

export async function bootstrapApplication(app: AppInstance, options: AerogelOptions = {}): Promise<void> {
    const plugins = [testing, directives, errors, lang, services, ui, ...(options.plugins ?? [])];

    App.instance = app;

    await installPlugins(plugins, app, options);
    await options.install?.(app);
    await Events.emit('application-ready');
}

export async function bootstrap(rootComponent: Component, options: AerogelOptions = {}): Promise<AerogelApp> {
    const app = createApp(rootComponent);

    if (isDevelopment() && !globalThis.__aerogelStorybook__) {
        globalThis.$aerogel = app;
    }

    if (options.env) {
        try {
            setupEnv(options.env);
        } catch (error) {
            queueStartupError(error);
        }
    }

    await bootstrapApplication(app, options);

    if (globalThis.__aerogelStorybook__) {
        return { app, options };
    }

    app.mount('#app');
    app._container?.classList.remove('loading');

    await Events.emit('application-mounted');

    return { app, options };
}

declare global {
    var $aerogel: AppInstance | undefined; // oxlint-disable-line no-var
    var __aerogelStorybook__: boolean | undefined; // oxlint-disable-line no-var
}

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        'application-ready': void;
        'application-mounted': void;
    }
}
