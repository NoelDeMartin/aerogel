import { computed, shallowRef, unref } from 'vue';
import { App, Events } from '@aerogel/core';
import { Storage, facade, objectOnly, once } from '@noeldemartin/utils';
import type { ComputedRef, Ref } from 'vue';
import type {
    RouteLocationNormalized,
    RouteLocationNormalizedLoaded,
    RouteLocationRaw,
    RouteParamValue,
    RouteParams,
    Router,
} from 'vue-router';

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
        router.beforeEach((to) => this.beforeNavigation(to));
    }

    protected async boot(): Promise<void> {
        Events.on(
            'before-login',
            () =>
                (this.flashRoute = objectOnly(this.currentRoute.value as unknown as Record<string, unknown>, [
                    'path',
                    'query',
                    'hash',
                ]) as RouteLocationRaw),
        );
        Events.on('login', async () => {
            if (!this.flashRoute) {
                return;
            }

            await this.replace(this.flashRoute);

            this.flashRoute = null;
        });
    }

    protected __get(property: string): unknown {
        return this.router.value
            ? super.__get(property) ?? Reflect.get(this.router.value, property)
            : super.__get(property);
    }

    protected async beforeNavigation(route: RouteLocationNormalized): Promise<void> {
        const resolvedParams: Record<string, unknown> = { ...route.params };

        for (const [paramName, paramValue] of Object.entries(route.params)) {
            resolvedParams[paramName] = await this.resolveBinding(paramName, paramValue, resolvedParams);
        }

        this.routesParams.value = {
            ...this.routesParams.value,
            [route.path]: resolvedParams,
        };
    }

    protected handleStatic404Redirect(): void {
        const route = Storage.pull<RouteLocationRaw>('static-404-redirect');

        route && this.replace(route);
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

export default facade(new RouterService());
