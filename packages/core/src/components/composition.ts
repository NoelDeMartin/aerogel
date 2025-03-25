import { customRef } from 'vue';
import type { Ref } from 'vue';

import { getElement } from '@aerogel/core/components/interfaces';

export function elementRef(): Ref<HTMLElement | undefined> {
    return customRef((track, trigger) => {
        let value: HTMLElement | undefined = undefined;

        return {
            get() {
                track();

                return value;
            },
            set(newValue) {
                value = getElement(newValue);

                trigger();
            },
        };
    });
}
