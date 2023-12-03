import type { ComputedRef, DeepReadonly, Ref } from 'vue';

import { stringProp } from '@/utils';

export interface IAGHeadlessInput {
    id: string;
    name: ComputedRef<string | null>;
    label: ComputedRef<string | null>;
    value: ComputedRef<string | number | boolean | null>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: string | number | boolean | null): void;
}

export const inputProps = {
    name: stringProp(),
    label: stringProp(),
};

export function useInputProps(): typeof inputProps {
    return inputProps;
}

export function extractInputProps<T extends Record<keyof typeof inputProps, unknown>>(
    componentProps: T,
): Pick<T, keyof typeof inputProps> {
    return Object.keys(inputProps).reduce((extractedProps, selectProp) => {
        const prop = selectProp as keyof typeof inputProps;

        extractedProps[prop] = componentProps[prop];

        return extractedProps;
    }, {} as Pick<T, keyof typeof inputProps>);
}
