import { objectWithout } from '@noeldemartin/utils';
import { computed, useAttrs } from 'vue';
import type { ComputedRef } from 'vue';

export function useInputAttrs(): [ComputedRef<{}>, ComputedRef<unknown>] {
    const attrs = useAttrs();
    const className = computed(() => attrs.class);
    const inputAttrs = computed(() => objectWithout(attrs, 'class'));

    return [inputAttrs, className];
}
