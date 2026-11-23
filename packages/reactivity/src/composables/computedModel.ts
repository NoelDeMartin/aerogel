import { IS_REACTIVE, RAW } from '@aerogel/reactivity/internals/flags';
import { listenToModelChanges } from '@aerogel/reactivity/internals/tracking';
import { isInstanceOf, tap, throttle } from '@noeldemartin/utils';
import { Model, getRelatedClasses } from 'soukai-bis';
import { customRef, getCurrentScope, onScopeDispose, toRaw, watchEffect } from 'vue';
import type { Ref } from 'vue';

function createModelProxy<T extends object>(model: T, track: () => void, trigger: () => void): T {
    return new Proxy(model, {
        get(target, prop, receiver) {
            if (prop === RAW) {
                return target;
            }

            if (prop === IS_REACTIVE) {
                return true;
            }

            track();
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, val, receiver) {
            const result = Reflect.set(target, prop, val, receiver);

            trigger();

            return result;
        },
    });
}

export function computedModel<T>(compute: () => T): Readonly<Ref<T>> {
    return customRef((track, trigger) => {
        let value: T;
        let rawValue: T;
        let proxy: T | null = null;
        const listeners: Array<() => void> = [];
        const onModelUpdated = throttle(trigger);
        const stopListeners = () => {
            listeners.forEach((stop) => stop());
            listeners.splice(0, listeners.length);
        };

        getCurrentScope() && onScopeDispose(stopListeners);
        watchEffect(() => {
            const newValue = toRaw(compute());

            if (
                rawValue instanceof Model &&
                (!isInstanceOf(newValue, Model) || newValue.static() !== rawValue.static())
            ) {
                stopListeners();
            }

            if (newValue instanceof Model) {
                if (newValue !== rawValue) {
                    proxy = createModelProxy(newValue, track, trigger) as T;
                }

                value = proxy as T;
            } else {
                value = newValue;
                proxy = null;
            }

            rawValue = newValue;

            trigger();

            if (!isInstanceOf(rawValue, Model) || listeners.length) {
                return;
            }

            for (const modelClass of getRelatedClasses(rawValue.static())) {
                listeners.push(...listenToModelChanges(modelClass, onModelUpdated));
            }
        });

        return {
            get: () => tap(value, () => track()),

            // oxlint-disable-next-line no-console
            set: () => console.warn('Computed model ref was not set (it is immutable).'),
        };
    });
}
