import type { Service } from '@aerogel/core';
import { onScopeDispose, watch } from 'vue';

export type ServiceStateUpdate<T extends Service> = Parameters<T['setState']>[0];

/**
 * Overrides service state for as long as the current component is mounted, and restores the original values afterwards.
 *
 * The state getter is reactive, so it can read story args in order to update the state using Storybook controls.
 */
export function useServiceState<T extends Service>(service: T, state: () => ServiceStateUpdate<T>): void {
    const original: Record<string, unknown> = {};

    watch(
        state,
        (update) => {
            for (const key of Object.keys(update)) {
                if (key in original) {
                    continue;
                }

                original[key] = service.getState(key);
            }

            service.setState(update);
        },
        { immediate: true },
    );

    onScopeDispose(() => service.setState(original));
}

/**
 * Replaces a service method for as long as the current component is mounted, and restores the original afterwards.
 *
 * This is useful to prevent stories from triggering side effects such as network requests or redirects.
 */
export function useServiceStub<T extends Service, TMethod extends keyof T>(
    service: T,
    method: TMethod,
    implementation: NoInfer<T[TMethod]>,
): void {
    const original = service[method];

    service[method] = implementation;

    onScopeDispose(() => (service[method] = original));
}
