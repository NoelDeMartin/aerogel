import Aerogel from 'virtual:aerogel';

import { PromisedValue, facade, forever, updateLocationQueryParameters } from '@noeldemartin/utils';

import Events from '@aerogel/core/services/Events';
import type { Plugin } from '@aerogel/core/plugins';
import type { Services } from '@aerogel/core/services';

import Service from './App.state';

export class AppService extends Service {

    public readonly name = Aerogel.name;
    public readonly ready = new PromisedValue<void>();
    public readonly mounted = new PromisedValue<void>();

    public isReady(): boolean {
        return this.ready.isResolved();
    }

    public isMounted(): boolean {
        return this.mounted.isResolved();
    }

    public async whenReady<T>(callback: () => T): Promise<T> {
        const result = await this.ready.then(callback);

        return result;
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

    public service<T extends keyof Services>(name: T): Services[T] | null {
        return this.instance?.config.globalProperties[name] ?? null;
    }

    protected override async boot(): Promise<void> {
        Events.once('application-ready', () => this.ready.resolve());
        Events.once('application-mounted', () => this.mounted.resolve());
    }

}

export default facade(AppService);
