import { App } from '@aerogel/core';
import { computed, defineComponent, h } from 'vue';
import { useRoute } from 'vue-router';
import type { Component, ConcreteComponent } from 'vue';
import type { NavigationGuardWithThis, RouteRecordRaw } from 'vue-router';

import Router from '../services/Router';
import type { RouteBindings } from '../services/Router';

export type AerogelRoute = RouteRecordRaw;

function setupPageComponent(pageComponent: ConcreteComponent) {
    const route = useRoute();
    const pageParams = computed(() => Router.routesParams?.value[route.path]);

    return () => h(pageComponent, pageParams.value);
}

function defineRouteComponent(pageComponent: ConcreteComponent): Component {
    return defineComponent({
        setup: () => setupPageComponent(pageComponent),
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

            return defineRouteComponent(component);
        };

        return;
    }

    route.component = defineRouteComponent(route.component);
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
