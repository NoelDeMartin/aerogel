import { computed, ref, shallowRef, unref, watch } from 'vue';
import { computedModel } from '@aerogel/plugin-soukai';
import { App, Events, computedAsync } from '@aerogel/core';
import { Storage, facade, objectOnly, once } from '@noeldemartin/utils';
import type { ComputedRef, Ref, WatchStopHandle } from 'vue';
import type { RouteLocationNormalizedLoaded, RouteLocationRaw, RouteParamValue, RouteParams, Router } from 'vue-router';

import { computedRouteParams } from '@aerogel/plugin-routing/utils/internal';

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
    protected history: string[];
    protected routesStopWatchers: Record<string, WatchStopHandle[]>;

    constructor() {
        super();

        this.router = shallowRef(null);
        this.bindings = {};
        this.history = [];
        this.routesStopWatchers = {};
        this.routesParams = shallowRef({});
        this.currentRoute = computed(() => {
            const router = this.router.value;
            const routesParams = this.routesParams.value;

            if (!router) {
                return null;
            }

            const route = unref(router.currentRoute);

            return {
                ...route,
                params: routesParams?.[route.path],
                rawParams: route.params,
            };
        });
    }

    public use(router: Router, options: { bindings?: RouteBindings } = {}): void {
        this.router.value = router;
        this.bindings = options.bindings ?? {};

        router.beforeEach(once(() => this.handleStatic404Redirect()));
        router.beforeEach((to) => this.onEnterRoute(to.path, to.params));
    }

    protected override async boot(): Promise<void> {
        Events.on('auth:before-login', () => this.storeFlashRoute());
        Events.on('auth:login', () => this.restoreFlashRoute());
        Events.on('purge-storage', () => this.push({ name: 'home' }));
    }

    protected override __get(property: string): unknown {
        return this.router.value
            ? (super.__get(property) ?? Reflect.get(this.router.value, property))
            : super.__get(property);
    }

    protected async onEnterRoute(path: string, params: RouteParams): Promise<void> {
        if (path in this.routesParams.value) {
            return;
        }

        const resolvedParams: Record<string, unknown> = { ...params };
        const stopWatchers: WatchStopHandle[] = [];

        for (const [paramName, paramValue] of Object.entries(params)) {
            const resolvedValue = await this.resolveBinding(path, paramName, paramValue);
            const stopWatcher = watch(resolvedValue, (newValue) => {
                this.routesParams.value = {
                    ...this.routesParams.value,
                    [path]: {
                        ...this.routesParams.value[path],
                        [paramName]: newValue,
                    },
                };
            });

            stopWatchers.push(stopWatcher);

            resolvedParams[paramName] = resolvedValue.value;
        }

        this.history = this.history.slice(0, 3);
        this.history.unshift(path);

        const routesParams = {
            ...this.routesParams.value,
            [path]: {
                ...resolvedParams,
                ...(this.routesParams.value[path] ?? {}),
            },
        };

        for (const routePath in routesParams) {
            if (this.history.includes(routePath)) {
                continue;
            }

            this.routesStopWatchers[routePath]?.forEach((stop) => stop());
        }

        this.routesParams.value = objectOnly(routesParams, this.history);
        this.routesStopWatchers = objectOnly(this.routesStopWatchers, this.history);
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
        path: string,
        name: string,
        value: RouteParamValue | RouteParamValue[],
    ): Promise<Ref<unknown>> {
        const binding = this.bindings[name];

        if (Array.isArray(value) || !binding) {
            return ref(value);
        }

        await App.ready;

        const otherParams = computedRouteParams(path, name);
        const computedBinding = computedAsync(() => Promise.resolve(binding(value, otherParams.value)));

        return computedModel(() => computedBinding.value);
    }

}

export interface RouterService extends Omit<Router, 'currentRoute'> {}

export default facade(RouterService);
