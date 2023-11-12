import type { ComputedRef } from 'vue';

import { requiredArrayProp } from '@/utils/vue';

export type SelectOptionValue = string | number | boolean | object | null;

export interface IAGHeadlessSelect {
    value: ComputedRef<SelectOptionValue | undefined>;
    options: SelectOptionValue[];
    update(value: string | number | boolean | null): void;
}

export const selectProps = {
    options: requiredArrayProp<SelectOptionValue>(),
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
