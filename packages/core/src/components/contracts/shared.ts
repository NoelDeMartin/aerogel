import type { Ref } from 'vue';

export interface HasElement {
    $el: Readonly<Ref<HTMLElement | undefined>>;
}

export interface __SetsElement {
    __setElement(element?: HTMLElement): void;
}
