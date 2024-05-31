import type { ComputedRef, DeepReadonly, ExtractPropTypes, Ref } from 'vue';

import { mixedProp, stringProp } from '@/utils';
import { extractComponentProps } from '@/components/utils';
import type { FormFieldValue } from '@/forms/Form';

export interface IAGHeadlessInput {
    id: string;
    name: ComputedRef<string | null>;
    label: ComputedRef<string | null>;
    description: ComputedRef<string | boolean | null>;
    value: ComputedRef<FormFieldValue | null>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: FormFieldValue | null): void;
}

export const inputProps = {
    name: stringProp(),
    label: stringProp(),
    description: stringProp(),
    modelValue: mixedProp<FormFieldValue>([String, Number, Boolean]),
};

export function useInputProps(): typeof inputProps {
    return inputProps;
}

export function extractInputProps<T extends ExtractPropTypes<typeof inputProps>>(
    props: T,
): Pick<T, keyof typeof inputProps> {
    return extractComponentProps(props, inputProps);
}
