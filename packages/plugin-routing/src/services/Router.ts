import { computed, ref, unref } from 'vue';
import { Events } from '@aerogel/core';
import { facade, objectOnly } from '@noeldemartin/utils';
import type { ComputedRef, Ref } from 'vue';
import type { RouteLocationNormalizedLoaded, RouteParamValue, Router } from 'vue-router';

import Service from './Router.state';

export type LoadedRoute = Omit<RouteLocationNormalizedLoaded, 'params'> & { params: Record<string, unknown> };
export type RouteBinding = (slug: string, params: Record<string, unknown>) => unknown | Promise<unknown>;
export type RouteBindings = Record<string, RouteBinding>;

export class RouterService extends Service {

    public readonly currentRoute: ComputedRef<LoadedRoute | null>;
    protected router: Ref<Router | null>;
    protected bindings: RouteBindings;
    protected currentRouteParams: Ref<Record<string, unknown>>;

    constructor() {
        super();

        this.router = ref(null);
        this.bindings = {};
        this.currentRouteParams = ref({});
        this.currentRoute = computed(() => {
            if (!this.router.value) {
                return null;
            }

            return {
                ...unref(this.router.value.currentRoute),
                params: this.currentRouteParams.value,
            };
        });
    }

    public use(router: Router, options: { bindings?: RouteBindings } = {}): void {
        this.router.value = router;
        this.bindings = options.bindings ?? {};
    }

    public updateRouteParams(params: Record<string, unknown>): void {
        this.currentRouteParams.value = params;
    }

    public async resolveBinding(
        name: string,
        value: RouteParamValue | RouteParamValue[],
        params: Record<string, unknown>,
    ): Promise<unknown> {
        if (Array.isArray(value)) {
            return value;
        }

        const binding = this.bindings[name] ?? (() => value);

        return binding(value, params);
    }

    protected async boot(): Promise<void> {
        Events.on(
            'before-login',
            () =>
                (this.flashRoute = objectOnly(this.currentRoute.value as unknown as Record<string, unknown>, [
                    'path',
                    'query',
                    'hash',
                ])),
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

}

export interface RouterService extends Omit<Router, 'currentRoute'> {}

export default facade(new RouterService());
