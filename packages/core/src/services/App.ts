import Aerogel from 'virtual:aerogel';

import {
    PromisedValue,
    facade,
    forever,
    isFacade,
    isInstanceOf,
    updateLocationQueryParameters,
} from '@noeldemartin/utils';
import { markRaw } from 'vue';

import BaseService from '@aerogel/core/services/Service';
import Events, { EventListenerPriorities } from '@aerogel/core/services/Events';
import type { Plugin } from '@aerogel/core/plugins';
import type { AppSetting, Services } from '@aerogel/core/services';

import Service from './App.state';

export { defineSettings } from './App.state';
export type { AppSetting } from './App.state';

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

    public addSetting(setting: AppSetting): void {
        this.settings.push(markRaw(setting));
    }

    public setSettingsFullscreenOnMobile(fullscreenOnMobile: boolean): void {
        this.settingsFullscreenOnMobile = fullscreenOnMobile;
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
        Events.on('purge-storage', { priority: EventListenerPriorities.Low }, () => this.purgeServicesStorage());
    }

    private purgeServicesStorage(): void {
        for (const globalProperty of Object.values(this.instance?.config.globalProperties ?? {})) {
            const instance = isFacade(globalProperty) ? globalProperty.requireInstance() : null;

            if (!instance || !isInstanceOf(instance, BaseService)) {
                continue;
            }

            instance.clearPersistedState();
        }
    }

}

export default facade(AppService);
