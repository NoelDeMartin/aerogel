import { PromisedValue, facade, forever, updateLocationQueryParameters } from '@noeldemartin/utils';

import Events from '@/services/Events';
import type { Plugin } from '@/plugins';

import Service from './App.state';

export class AppService extends Service {

    public readonly ready = new PromisedValue<void>();
    public readonly mounted = new PromisedValue<void>();

    public isReady(): boolean {
        return this.ready.isResolved();
    }

    public isMounted(): boolean {
        return this.mounted.isResolved();
    }

    public async reload(queryParameters?: Record<string, string | undefined>): Promise<void> {
        queryParameters && updateLocationQueryParameters(queryParameters);

        location.reload();

        // Stall until the reload happens
        await forever();
    }

    public plugin<T extends Plugin = Plugin>(name: string): T | null {
        return (this.plugins[name] as T) ?? null;
    }

    protected async boot(): Promise<void> {
        Events.once('application-ready', () => this.ready.resolve());
        Events.once('application-mounted', () => this.mounted.resolve());
    }

}

export default facade(new AppService());
