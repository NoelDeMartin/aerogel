import Router from '@aerogel/plugin-routing/services/Router';
import type { RouteLocationRaw } from 'vue-router';

export function routeUrl(route: RouteLocationRaw): URL {
    return new URL(Router.resolve(route).href, location.origin);
}
