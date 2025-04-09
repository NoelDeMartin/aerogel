import { objectWithout } from '@noeldemartin/utils';
import { computed, inject, onUnmounted, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import type { ComputedRef } from 'vue';
import type { FormController } from '@aerogel/core/forms';
import type { Nullable } from '@noeldemartin/utils';

export function onFormFocus(input: { name: Nullable<string> }, listener: () => unknown): void {
    const form = inject<FormController | null>('form', null);
    const stop = form?.on('focus', (name) => input.name === name && listener());

    onUnmounted(() => stop?.());
}

export function useInputAttrs(): [ComputedRef<{}>, ComputedRef<ClassValue>] {
    const attrs = useAttrs();
    const classes = computed(() => attrs.class);
    const inputAttrs = computed(() => objectWithout(attrs, 'class'));

    return [inputAttrs, classes as ComputedRef<ClassValue>];
}
