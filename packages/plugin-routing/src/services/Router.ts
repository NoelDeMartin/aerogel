import { App, Events, computedAsync } from '@aerogel/core';
import BindingNotFound from '@aerogel/plugin-routing/utils/BindingNotFound';
import { computedRouteParams } from '@aerogel/plugin-routing/utils/internal';
import { bindingNotFound } from '@aerogel/plugin-routing/utils/routes';
import { resolveModelBinding } from '@aerogel/plugin-routing/utils/soukai';
import { computedModel } from '@aerogel/plugin-solid';
import { PromisedValue, Storage, facade, objectOnly, once, toError } from '@noeldemartin/utils';
import { isModelClass } from 'soukai-bis';
import type { ModelConstructor } from 'soukai-bis';
import { computed, ref, shallowRef, unref, watch } from 'vue';
import type { ComputedRef, Ref, WatchStopHandle } from 'vue';
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
export type RouteBinding = ModelConstructor | ((slug: string, params: Record<string, unknown>) => unknown);
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
                params: routesParams?.[route.fullPath],
                rawParams: route.params,
            };
        });
    }

    public use(router: Router, options: { bindings?: RouteBindings } = {}): void {
        this.router.value = router;
        this.bindings = options.bindings ?? {};

        router.beforeEach(once(() => this.handleStatic404Redirect()));
        router.beforeEach((to) => this.onEnterRoute(to));
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

    protected async onEnterRoute(route: RouteLocationNormalized): Promise<void> {
        const { fullPath, params } = route;

        if (fullPath in this.routesParams.value) {
            return;
        }

        const resolvedParams: Record<string, unknown> = {};
        const stopWatchers: WatchStopHandle[] = [];

        for (const [paramName, paramValue] of Object.entries(params)) {
            const resolvedValue = await this.resolveBinding(route, paramName, paramValue, resolvedParams);
            const stopWatcher = watch(resolvedValue, (newValue) => {
                this.routesParams.value = {
                    ...this.routesParams.value,
                    [fullPath]: {
                        ...this.routesParams.value[fullPath],
                        [paramName]: newValue,
                    },
                };
            });

            stopWatchers.push(stopWatcher);

            resolvedParams[paramName] = resolvedValue.value;
        }

        this.routesStopWatchers[fullPath] = stopWatchers;

        this.history = this.history.slice(0, 3);
        this.history.unshift(fullPath);

        const routesParams = {
            ...this.routesParams.value,
            [fullPath]: {
                ...resolvedParams,
                ...this.routesParams.value[fullPath],
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

        route && void this.replace(route);
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

        void App.whenReady(() => this.replace(flashRoute));

        this.flashRoute = null;
    }

    protected async resolveBinding(
        route: RouteLocationNormalized,
        name: string,
        value: RouteParamValue | RouteParamValue[],
        resolvedParams: Record<string, unknown>,
    ): Promise<Ref<unknown>> {
        const binding = this.bindings[name];

        if (Array.isArray(value) || !binding) {
            return ref(value);
        }

        await App.ready;

        const parentNames = Object.keys(resolvedParams);
        const otherParams = computedRouteParams(route.fullPath, parentNames, this.routesParams, resolvedParams);
        const initialValue = new PromisedValue<unknown>();
        const computedBinding = computedAsync(async () => {
            try {
                const result = Object.values(otherParams.value).some((param) => param instanceof BindingNotFound)
                    ? bindingNotFound(value)
                    : isModelClass(binding)
                      ? await resolveModelBinding(binding, value, route, otherParams.value)
                      : await binding(value, otherParams.value);

                initialValue.isSettled() || initialValue.resolve(result);

                return result;
            } catch (error) {
                initialValue.isSettled() || initialValue.reject(toError(error));

                throw error;
            }
        });

        const resolvedInitialValue = await initialValue;

        return computedModel(() => computedBinding.value ?? resolvedInitialValue);
    }
}

export interface RouterService extends Omit<Router, 'currentRoute'> {}

export default facade(RouterService);
