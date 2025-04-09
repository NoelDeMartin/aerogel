import { debounce } from '@noeldemartin/utils';
import { computed, ref, watch, watchEffect } from 'vue';
import type { ComputedGetter, ComputedRef, Ref } from 'vue';

export interface ComputedDebounceOptions<T> {
    initial?: T;
    delay?: number;
}

export function computedAsync<T>(getter: () => Promise<T>): Ref<T | undefined> {
    const result = ref<T>();
    const asyncValue = computed(getter);

    watch(asyncValue, async () => (result.value = await asyncValue.value), { immediate: true });

    return result;
}

export function computedDebounce<T>(options: ComputedDebounceOptions<T>, getter: ComputedGetter<T>): ComputedRef<T>;
export function computedDebounce<T>(getter: ComputedGetter<T>): ComputedRef<T | null>;
export function computedDebounce<T>(
    optionsOrGetter: ComputedGetter<T> | ComputedDebounceOptions<T>,
    inputGetter?: ComputedGetter<T>,
): ComputedRef<T> {
    const inputOptions = inputGetter ? (optionsOrGetter as ComputedDebounceOptions<T>) : {};
    const getter = inputGetter ?? (optionsOrGetter as ComputedGetter<T>);
    const state = ref(inputOptions.initial ?? null);
    const update = debounce((value) => (state.value = value), inputOptions.delay ?? 300);

    watchEffect(() => update(getter()));

    return state as unknown as ComputedRef<T>;
}
