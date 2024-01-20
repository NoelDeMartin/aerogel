import { defineComponent, h, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import type { Component, ConcreteComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import Router from './services/Router';
import type { RouteBindings } from './services/Router';

export type AerogelRoute = RouteRecordRaw;

function setupPageComponent(pageComponent: ConcreteComponent) {
    const route = useRoute();
    const params = ref<Record<string, unknown>>({});

    async function updateResolvedRouteParams() {
        params.value = await resolveRouteParameters();

        Router.updateRouteParams(params.value);
    }

    async function resolveRouteParameters(): Promise<Record<string, unknown>> {
        const resolvedParams: Record<string, unknown> = { ...route.params };

        for (const [paramName, paramValue] of Object.entries(route.params)) {
            resolvedParams[paramName] = await Router.resolveBinding(paramName, paramValue, resolvedParams);
        }

        return resolvedParams;
    }

    onBeforeRouteUpdate(() => updateResolvedRouteParams());
    updateResolvedRouteParams();

    return () => h(pageComponent, params.value);
}

function enhanceRouteComponent(pageComponent: ConcreteComponent): Component {
    return defineComponent({
        setup: () => setupPageComponent(pageComponent),
    });
}

export function defineRoute(route: AerogelRoute): RouteRecordRaw {
    if (typeof route.component === 'function') {
        const lazyComponent = route.component as () => Promise<{ default: ConcreteComponent }>;

        route.component = async () => {
            const { default: component } = await lazyComponent();

            return enhanceRouteComponent(component);
        };
    } else if (route.component) {
        route.component = enhanceRouteComponent(route.component as ConcreteComponent);
    }

    return route;
}

export function defineRouteBindings(bindings: RouteBindings): RouteBindings {
    return bindings;
}

export function defineRoutes(routes: AerogelRoute[]): RouteRecordRaw[] {
    return routes.map(defineRoute);
}
