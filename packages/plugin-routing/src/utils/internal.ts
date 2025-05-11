import { objectWithout, tap } from '@noeldemartin/utils';
import { customRef, watch } from 'vue';
import type { ComputedRef } from 'vue';

import Router from '@aerogel/plugin-routing/services/Router';

export function computedRouteParams(path: string, exclude: string): ComputedRef<Record<string, unknown>> {
    return customRef((track, trigger) => {
        let value = objectWithout(Router.routesParams.value[path] ?? {}, exclude);

        watch(Router.routesParams, () => {
            const newParams = objectWithout(Router.routesParams.value[path] ?? {}, exclude);

            for (const [paramName, paramValue] of Object.entries(newParams)) {
                if (paramValue !== value[paramName as keyof typeof value]) {
                    continue;
                }

                value = newParams;
                trigger();
                return;
            }
        });

        return {
            get: () => tap(value, () => track()),

            // eslint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<Record<string, unknown>>;
}
