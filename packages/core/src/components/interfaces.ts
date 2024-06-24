import { isObject } from '@noeldemartin/utils';
import type { Ref, UnwrapNestedRefs } from 'vue';

export function getElement(value: unknown): HTMLElement | undefined {
    if (value instanceof HTMLElement) {
        return value;
    }

    if (hasElement(value)) {
        return value.$el;
    }
}

export function hasElement(value: unknown): value is UnwrapNestedRefs<HasElement> {
    return isObject(value) && '$el' in value;
}

export interface __SetsElement {
    __setElement(element?: HTMLElement): void;
}

export interface HasElement {
    $el: Readonly<Ref<HTMLElement | undefined>>;
}
