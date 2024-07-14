import { App } from '@aerogel/core';
import { computed, defineComponent, h, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import type { Component, ConcreteComponent } from 'vue';
import type { NavigationGuardWithThis, RouteRecordRaw } from 'vue-router';

import Router from '../services/Router';
import type { RouteBindings } from '../services/Router';

export type AerogelRoute = RouteRecordRaw & {
    title?: string | ((params: Record<string, unknown>) => string | undefined | null);
};

function setupPageComponent(pageComponent: ConcreteComponent, routeConfig: AerogelRoute) {
    const route = useRoute();
    const pageParams = computed(() => Router.routesParams?.value[route.path]);
    const routeTitle = computed(() => {
        if (!routeConfig?.title || !pageParams.value) {
            return null;
        }

        if (typeof routeConfig.title === 'string') {
            return routeConfig.title;
        }

        return routeConfig.title(pageParams.value);
    });

    watchEffect(() => updateRouteTitle(routeTitle.value));

    return () => h(pageComponent, pageParams.value);
}

function defineRouteComponent(pageComponent: ConcreteComponent, route: AerogelRoute): Component {
    return defineComponent({
        setup: () => setupPageComponent(pageComponent, route),
    });
}

function enhanceRouteComponent(route: AerogelRoute): void {
    if (!route.component) {
        return;
    }

    if (typeof route.component === 'function') {
        const lazyComponent = route.component as () => Promise<{ default: ConcreteComponent }>;

        route.component = async () => {
            const { default: component } = await lazyComponent();

            return defineRouteComponent(component, route);
        };

        return;
    }

    route.component = defineRouteComponent(route.component, route);
}

function enhanceRouteNavigationGuard(guard: NavigationGuardWithThis<undefined>): NavigationGuardWithThis<undefined> {
    return async function(this, ...args) {
        await App.ready;

        return guard.call(this, ...args);
    };
}

function enhanceRouteNavigationGuards(route: AerogelRoute): void {
    if (!route.beforeEnter) {
        return;
    }

    if (Array.isArray(route.beforeEnter)) {
        route.beforeEnter = route.beforeEnter.map(enhanceRouteNavigationGuard);

        return;
    }

    route.beforeEnter = enhanceRouteNavigationGuard(route.beforeEnter);
}

function updateRouteTitle(title?: string | null): void {
    if (!globalThis.document) {
        return;
    }

    if (!title) {
        globalThis.document.title = App.name;

        return;
    }

    globalThis.document.title = `${title} | ${App.name}`;
}

export function defineRoute(route: AerogelRoute): RouteRecordRaw {
    enhanceRouteComponent(route);
    enhanceRouteNavigationGuards(route);

    return route;
}

export function defineRouteBindings(bindings: RouteBindings): RouteBindings {
    return bindings;
}

export function defineRoutes(routes: AerogelRoute[]): RouteRecordRaw[] {
    return routes.map(defineRoute);
}
