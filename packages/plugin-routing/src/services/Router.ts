import { computed, shallowRef, unref } from 'vue';
import { App, EventListenerPriorities, Events } from '@aerogel/core';
import { Storage, facade, objectOnly, once } from '@noeldemartin/utils';
import type { ComputedRef, Ref } from 'vue';
import type { RouteLocationNormalizedLoaded, RouteLocationRaw, RouteParamValue, RouteParams, Router } from 'vue-router';

import Service from './Router.state';

export type LoadedRoute = Omit<RouteLocationNormalizedLoaded, 'params'> & {
    rawParams: RouteParams;
    params?: Record<string, unknown>;
};
export type RouteBinding = (slug: string, params: Record<string, unknown>) => unknown | Promise<unknown>;
export type RouteBindings = Record<string, RouteBinding>;

export class RouterService extends Service {

    public readonly currentRoute: ComputedRef<LoadedRoute | null>;
    public readonly routesParams: Ref<Record<string, Record<string, unknown>>>;
    protected router: Ref<Router | null>;
    protected bindings: RouteBindings;

    constructor() {
        super();

        this.router = shallowRef(null);
        this.bindings = {};
        this.routesParams = shallowRef({});
        this.currentRoute = computed(() => {
            if (!this.router.value) {
                return null;
            }

            const route = unref(this.router.value.currentRoute);

            return {
                ...route,
                params: this.routesParams.value?.[route.path],
                rawParams: route.params,
            };
        });
    }

    public use(router: Router, options: { bindings?: RouteBindings } = {}): void {
        this.router.value = router;
        this.bindings = options.bindings ?? {};

        router.beforeEach(once(() => this.handleStatic404Redirect()));
        router.beforeEach((to) => this.updateRouteParams(to.path, to.params));
    }

    protected async boot(): Promise<void> {
        Events.on('auth:before-login', () => this.storeFlashRoute());
        Events.on('auth:login', () => this.restoreFlashRoute());
        Events.on('cloud:migrated', { priority: EventListenerPriorities.Low }, () => this.updateCurrentRouteParams());
    }

    protected __get(property: string): unknown {
        return this.router.value
            ? super.__get(property) ?? Reflect.get(this.router.value, property)
            : super.__get(property);
    }

    protected async updateCurrentRouteParams(): Promise<void> {
        if (!this.currentRoute.value) {
            return;
        }

        await this.updateRouteParams(this.currentRoute.value.path, this.currentRoute.value.rawParams);
    }

    protected async updateRouteParams(path: string, params: RouteParams): Promise<void> {
        const resolvedParams: Record<string, unknown> = { ...params };

        for (const [paramName, paramValue] of Object.entries(params)) {
            resolvedParams[paramName] = await this.resolveBinding(paramName, paramValue, resolvedParams);
        }

        this.routesParams.value = {
            ...this.routesParams.value,
            [path]: resolvedParams,
        };
    }

    protected handleStatic404Redirect(): void {
        const route = Storage.pull<RouteLocationRaw>('static-404-redirect');

        route && this.replace(route);
    }

    protected storeFlashRoute(): void {
        this.flashRoute = objectOnly(this.currentRoute.value as unknown as Record<string, unknown>, [
            'path',
            'query',
            'hash',
        ]) as RouteLocationRaw;
    }

    protected async restoreFlashRoute(): Promise<void> {
        if (!this.flashRoute) {
            return;
        }

        const flashRoute = this.flashRoute;

        App.whenReady(() => this.replace(flashRoute));

        this.flashRoute = null;
    }

    protected async resolveBinding(
        name: string,
        value: RouteParamValue | RouteParamValue[],
        params: Record<string, unknown>,
    ): Promise<unknown> {
        const binding = this.bindings[name];

        if (Array.isArray(value) || !binding) {
            return value;
        }

        await App.ready;

        return binding(value, params);
    }

}

export interface RouterService extends Omit<Router, 'currentRoute'> {}

export default facade(RouterService);
