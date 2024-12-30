import { debounce } from '@noeldemartin/utils';
import { ref, watchEffect } from 'vue';
import type { ComputedGetter, ComputedRef } from '@vue/runtime-core';

export interface ComputedDebounceOptions<T> {
    initial?: T;
    delay?: number;
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
