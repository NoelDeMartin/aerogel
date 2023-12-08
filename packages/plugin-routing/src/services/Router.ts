import { Events } from '@aerogel/core';
import { facade, fail } from '@noeldemartin/utils';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

import Service from './Router.state';

export class RouterService extends Service {

    public router?: Router;

    public get currentRoute(): RouteLocationNormalizedLoaded {
        return this.requireRouter().currentRoute.value;
    }

    protected async boot(): Promise<void> {
        Events.on('before-login', () => (this.flashRoute = this.currentRoute));
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
