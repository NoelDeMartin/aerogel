import type { Nullable } from '@noeldemartin/utils';

export interface ElementMethods {
    focus(): void;
    blur(): void;
}

export function exposeElementMethods(getter: () => Nullable<HTMLElement>): ElementMethods {
    return {
        focus: () => getter()?.focus(),
        blur: () => getter()?.blur(),
    };
}
