import { facade, updateLocationQueryParameters } from '@noeldemartin/utils';

import Events from '@/services/Events';
import type { Plugin } from '@/plugins';

import Service from './App.state';

export class AppService extends Service {

    public async reload(queryParameters?: Record<string, string | undefined>): Promise<void> {
        queryParameters && updateLocationQueryParameters(queryParameters);

        location.reload();

        await new Promise(() => {
            // Stall until actual reload happens
        });
    }

    public plugin<T extends Plugin = Plugin>(name: string): T | null {
        return (this.plugins[name] as T) ?? null;
    }

    protected async boot(): Promise<void> {
        Events.once('application-mounted', () => this.setState({ isMounted: true }));
    }

}

export default facade(new AppService());
