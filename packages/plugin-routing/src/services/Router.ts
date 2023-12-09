import { Events } from '@aerogel/core';
import { facade, fail, objectOnly } from '@noeldemartin/utils';
import type { Router } from 'vue-router';

import Service from './Router.state';

export class RouterService extends Service {

    public router?: Router;

    protected async boot(): Promise<void> {
        Events.on(
            'before-login',
            () =>
                (this.flashRoute = objectOnly(
                    this.requireRouter().currentRoute.value as unknown as Record<string, unknown>,
                    ['path', 'query', 'hash'],
                )),
        );
        Events.on('login', async () => {
            if (!this.flashRoute) {
                return;
            }

            await this.requireRouter().replace(this.flashRoute);

            this.flashRoute = null;
        });
    }

    protected requireRouter(): Router {
        return this.router ?? fail('Router not loaded');
    }

}

export default facade(new RouterService());
