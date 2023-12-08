import type { ComputedRef, DeepReadonly, ExtractPropTypes, Ref } from 'vue';

import { requiredArrayProp, stringProp } from '@/utils/vue';
import { extractComponentProps } from '@/components/utils';

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
    name: stringProp(),
    label: stringProp(),
    options: requiredArrayProp<IAGSelectOptionValue>(),
    noSelectionText: stringProp(),
};

export function useSelectProps(): typeof selectProps {
    return selectProps;
}

export function extractSelectProps<T extends ExtractPropTypes<typeof selectProps>>(
    props: T,
): Pick<T, keyof typeof selectProps> {
    return extractComponentProps(props, selectProps);
}
