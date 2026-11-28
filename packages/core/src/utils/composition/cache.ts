import Errors from '@aerogel/core/errors/Errors';
import Cache from '@aerogel/core/services/Cache';
import type { CacheEntry } from '@aerogel/core/services/Cache';
import { noop } from '@noeldemartin/utils';
import { customRef, getCurrentScope, onScopeDispose, readonly, ref, toRaw } from 'vue';
import type { Ref } from 'vue';

const MAX_TIMEOUT_DELAY = 2 ** 31 - 1;

export interface UseCacheOptions<T> {
    defaultValue?: T;
    maxAge?: number;
}

export interface CacheState<T> {
    value: Ref<T>;
    stale: Readonly<Ref<boolean>>;
    ready: Readonly<Ref<boolean>>;
}

export function useCache<T>(key: string, options: UseCacheOptions<T> & { defaultValue: T }): CacheState<T>;
export function useCache<T>(key: string, options?: UseCacheOptions<T>): CacheState<T | undefined>;
export function useCache<T>(key: string, options: UseCacheOptions<T> = {}): CacheState<T | undefined> {
    const { defaultValue, maxAge } = options;
    const ready = ref(false);
    const stale = ref(false);
    let entry: CacheEntry<T> | undefined;
    let staleTimeout: ReturnType<typeof setTimeout> | undefined;
    let triggerValue: () => void = noop;
    const value = customRef<T | undefined>((track, trigger) => {
        triggerValue = trigger;

        return {
            get() {
                track();

                return entry?.value ?? defaultValue;
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

                update({ value: rawValue, updatedAt: new Date() });
                Cache.set(key, rawValue).catch((error) =>
                    Errors.reportDevelopmentError(error, `Could not write '${key}' to cache`),
                );
            },
        };
    });

    function update(newEntry: CacheEntry<T> | undefined): void {
        entry = newEntry;
        ready.value = true;

        triggerValue();
        updateStale();
    }

    function updateStale(): void {
        clearTimeout(staleTimeout);

        if (!entry || maxAge === undefined) {
            stale.value = !entry;

            return;
        }

        const remainingFreshTime = entry.updatedAt.getTime() + maxAge - Date.now();

        stale.value = remainingFreshTime <= 0;

        if (!stale.value) {
            staleTimeout = setTimeout(updateStale, Math.min(remainingFreshTime, MAX_TIMEOUT_DELAY));
        }
    }

    const stopListening = Cache.listeners.add({
        onUpdated: (updatedKey, updatedEntry) => updatedKey === key && update(updatedEntry as CacheEntry<T>),
        onDeleted: (deletedKey) => deletedKey === key && update(undefined),
        onCleared: () => update(undefined),
    });

    Cache.getEntry<T>(key)
        .then((cachedEntry) => {
            if (ready.value) {
                return;
            }

            update(cachedEntry);
        })
        .catch((error) => {
            Errors.reportDevelopmentError(error, `Could not read '${key}' from cache`);

            if (ready.value) {
                return;
            }

            update(undefined);
        });

    if (getCurrentScope()) {
        onScopeDispose(() => {
            stopListening();
            clearTimeout(staleTimeout);
        });
    }

    return { value, stale: readonly(stale), ready: readonly(ready) };
}
