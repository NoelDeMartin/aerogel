import type { ComputedRef, DeepReadonly, Ref } from 'vue';

import { requiredArrayProp, stringProp } from '@/utils/vue';

export interface IAGSelectOption {
    value: string | number | boolean | object | null;
    text: string;
}

export type IAGSelectOptionValue = string | number | boolean | object | null;

export interface IAGHeadlessSelect {
    id: string;
    label: ComputedRef<string | null>;
    noSelectionText: ComputedRef<string>;
    buttonText: ComputedRef<string>;
    selectedOption: ComputedRef<IAGSelectOption | undefined>;
    options: ComputedRef<IAGSelectOption[]>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: IAGSelectOptionValue): void;
}

export const selectProps = {
    options: requiredArrayProp<IAGSelectOptionValue>(),
    label: stringProp(),
    noSelectionText: stringProp(),
};

export function useSelectProps(): typeof selectProps {
    return selectProps;
}

export function extractSelectProps<T extends Record<keyof typeof selectProps, unknown>>(
    componentProps: T,
): Pick<T, keyof typeof selectProps> {
    return Object.keys(selectProps).reduce((extractedProps, selectProp) => {
        const prop = selectProp as keyof typeof selectProps;

        extractedProps[prop] = componentProps[prop];

        return extractedProps;
    }, {} as Pick<T, keyof typeof selectProps>);
}
