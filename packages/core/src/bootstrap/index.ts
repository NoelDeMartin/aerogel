import { createApp } from 'vue';
import type { Component } from 'vue';

import directives from '@/directives';
import errors from '@/errors';
import Events from '@/services/Events';
import lang from '@/lang';
import services from '@/services';
import ui from '@/ui';
import { installPlugins } from '@/plugins';
import type { AerogelOptions } from '@/bootstrap/options';

export async function bootstrapApplication(rootComponent: Component, options: AerogelOptions = {}): Promise<void> {
    const plugins = [directives, errors, lang, services, ui, ...(options.plugins ?? [])];
    const app = createApp(rootComponent);

    await installPlugins(plugins, app, options);

    app.mount('#app');
    app._container?.classList.remove('loading');

    Events.emit('application-mounted');
}

declare module '@/services/Events' {
    export interface EventsPayload {
        'application-mounted': void;
    }
}
