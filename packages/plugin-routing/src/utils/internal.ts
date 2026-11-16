import { objectOnly, tap } from '@noeldemartin/utils';
import { customRef, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';

export function computedRouteParams(
    path: string,
    paramNames: string[],
    routesParams: Ref<Record<string, Record<string, unknown>>>,
    initialParams: Record<string, unknown> = {},
): ComputedRef<Record<string, unknown>> {
    return customRef((track, trigger) => {
        const getParams = () => objectOnly({ ...initialParams, ...routesParams.value[path] }, paramNames);
        let value = getParams();

        watch(routesParams, () => {
            const newParams = getParams();

            for (const [paramName, paramValue] of Object.entries(newParams)) {
                if (paramValue === value[paramName as keyof typeof value]) {
                    continue;
                }

                value = newParams;
                trigger();
                return;
            }
        });

        return {
            get: () => tap(value, () => track()),

            // oxlint-disable-next-line no-console
            set: () => console.warn('Computed models ref was not set (it is immutable).'),
        };
    }) as ComputedRef<Record<string, unknown>>;
}
