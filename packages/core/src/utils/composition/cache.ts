import Errors from '@aerogel/core/errors/Errors';
import Cache from '@aerogel/core/services/Cache';
import { customRef, getCurrentScope, onScopeDispose, toRaw } from 'vue';
import type { Ref } from 'vue';

export type CacheRef<T> = Ref<T> & { ready: Promise<void> };

export function useCache<T>(key: string): CacheRef<T | undefined>;
export function useCache<T>(key: string, defaultValue: T): CacheRef<T>;
export function useCache<T>(key: string, defaultValue?: T): CacheRef<T | undefined> {
    let ready = Promise.resolve();
    const cacheRef = customRef<T | undefined>((track, trigger) => {
        let initialized = false;
        let value = defaultValue;
        const update = (newValue: T | undefined) => {
            initialized = true;
            value = newValue ?? defaultValue;

            trigger();
        };
        const stopListening = Cache.listeners.add({
            onUpdated: (updatedKey, updatedValue) => updatedKey === key && update(updatedValue as T),
            onDeleted: (deletedKey) => deletedKey === key && update(undefined),
            onCleared: () => update(undefined),
        });

        ready = Cache.get<T>(key)
            .then((cachedValue) => {
                if (initialized) {
                    return;
                }

                update(cachedValue);
            })
            .catch((error) => {
                initialized = true;

                Errors.reportDevelopmentError(error, `Could not read '${key}' from cache`);
            });

        if (getCurrentScope()) {
            onScopeDispose(stopListening);
        }

        return {
            get() {
                track();

                return value;
            },
            set(newValue) {
                if (newValue === undefined) {
                    update(undefined);
                    Cache.delete(key).catch((error) =>
                        Errors.reportDevelopmentError(error, `Could not delete '${key}' from cache`),
                    );

                    return;
                }

                const rawValue = toRaw(newValue);

                update(rawValue);
                Cache.set(key, rawValue).catch((error) =>
                    Errors.reportDevelopmentError(error, `Could not write '${key}' to cache`),
                );
            },
        };
    });

    return Object.assign(cacheRef, { ready });
}
