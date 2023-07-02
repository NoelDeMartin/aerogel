import { createApp, h } from 'vue';
import type { Component } from 'vue';

import directives from '@/directives';
import services from '@/services';
import ui from '@/ui';
import type { AerogelOptions } from '@/bootstrap/options';

export async function bootstrapApplication(rootComponent: Component, options: AerogelOptions = {}): Promise<void> {
    const plugins = [directives, services, ui, ...(options.plugins ?? [])];
    const app = createApp({
        data: () => ({
            ready: false,
        }),
        async mounted() {
            await Promise.all(options.plugins?.map((plugin) => plugin.onAppMounted?.()) ?? []);

            this.ready = true;
        },
        render() {
            if (!this.ready) {
                return null;
            }

            return h(rootComponent);
        },
    });

    await Promise.all(plugins.map((plugin) => plugin.install(app, options)) ?? []);

    app.mount('#app');
}
