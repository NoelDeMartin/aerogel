import { createApp, h } from 'vue';
import type { Component } from 'vue';

import directives from '@/directives';
import services from '@/services';
import ui from '@/ui';
import { runAppMountedHooks } from '@/bootstrap/hooks';
import type { BootstrapOptions } from '@/bootstrap/options';

export async function bootstrapApplication(rootComponent: Component, options: BootstrapOptions = {}): Promise<void> {
    const hooks = [directives, services, ui];
    const app = createApp({
        data: () => ({
            ready: false,
        }),
        async mounted() {
            runAppMountedHooks();

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

    await Promise.all(hooks.map((hook) => hook(app, options)));
    await Promise.all(options.plugins?.map((plugin) => plugin.install(app)) ?? []);

    app.mount('#app');
}
