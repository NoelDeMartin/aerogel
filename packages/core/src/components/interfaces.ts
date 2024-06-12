import type { Ref } from 'vue';

export interface __HasElement {
    __setElement(element?: HTMLElement): void;
}

export interface HasElement {
    $el: Readonly<Ref<HTMLElement | undefined>>;
}
