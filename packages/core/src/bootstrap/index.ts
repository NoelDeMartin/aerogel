import { createApp } from 'vue';
import type { App, Component } from 'vue';

import directives from '@/directives';
import errors from '@/errors';
import Events from '@/services/Events';
import lang from '@/lang';
import services from '@/services';
import ui from '@/ui';
import { installPlugins } from '@/plugins';
import type { AerogelOptions } from '@/bootstrap/options';

export { AerogelOptions };

export async function bootstrapApplication(app: App, options: AerogelOptions = {}): Promise<void> {
    const plugins = [directives, errors, lang, services, ui, ...(options.plugins ?? [])];

    await installPlugins(plugins, app, options);
    await options.install?.(app);
}

export async function bootstrap(rootComponent: Component, options: AerogelOptions = {}): Promise<void> {
    const app = createApp(rootComponent);

    await bootstrapApplication(app, options);

    app.mount('#app');
    app._container?.classList.remove('loading');

    Events.emit('application-mounted');
}

declare module '@/services/Events' {
    export interface EventsPayload {
        'application-mounted': void;
    }
}
