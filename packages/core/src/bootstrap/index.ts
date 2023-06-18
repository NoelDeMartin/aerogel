import { createApp, h } from 'vue';
import type { Component } from 'vue';

import directives from '@/directives';
import lang from '@/lang';
import models from '@/models';
import routing from '@/routing';
import services from '@/services';
import ui from '@/ui';
import { runAppMountedHooks } from '@/bootstrap/hooks';
import type { BootstrapOptions } from '@/bootstrap/options';

export async function bootstrapApplication(rootComponent: Component, options: BootstrapOptions = {}): Promise<void> {
    const hooks = [directives, lang, models, routing, services, ui];
    const app = createApp({
        data: () => ({
            ready: false,
        }),
        mounted() {
            runAppMountedHooks();

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

    app.mount('#app');
}
