import { objectWithout } from '@noeldemartin/utils';
import { computed, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import type { ComputedRef } from 'vue';

export function useInputAttrs(): [ComputedRef<{}>, ComputedRef<ClassValue>] {
    const attrs = useAttrs();
    const classes = computed(() => attrs.class);
    const inputAttrs = computed(() => objectWithout(attrs, 'class'));

    return [inputAttrs, classes as ComputedRef<ClassValue>];
}
