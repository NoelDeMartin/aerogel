import { listenLocalChanges, localChangesCount } from '@aerogel/reactivity/internals/local-changes';
import { computed, readonly } from 'vue';
import type { ComputedRef, Ref } from 'vue';

export interface UseLocalChangesResult {
    count: Readonly<Ref<number>>;
    dirty: ComputedRef<boolean>;
}

export function useLocalChanges(): UseLocalChangesResult {
    listenLocalChanges();

    return {
        count: readonly(localChangesCount),
        dirty: computed(() => localChangesCount.value > 0),
    };
}
