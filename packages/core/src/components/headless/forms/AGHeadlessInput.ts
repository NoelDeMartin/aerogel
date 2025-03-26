import type { ComputedRef, DeepReadonly, ExtractPropTypes, Ref } from 'vue';
import type { Writable } from '@noeldemartin/utils';

import { mixedProp, stringProp } from '@aerogel/core/utils';
import { extractComponentProps } from '@aerogel/core/components/utils';
import type { FormFieldValue } from '@aerogel/core/forms/Form';
import type { HasElement } from '@aerogel/core/components/interfaces';

export interface IAGHeadlessInput extends HasElement {
    id: string;
    name: ComputedRef<string | null>;
    label: ComputedRef<string | null>;
    description: ComputedRef<string | boolean | null>;
    value: ComputedRef<FormFieldValue | null>;
    required: ComputedRef<boolean | null>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: FormFieldValue | null): void;
}

export const inputProps = {
    name: stringProp(),
    label: stringProp(),
    description: stringProp(),
    modelValue: mixedProp<FormFieldValue>([String, Number, Boolean]),
};

export const inputEmits = ['update:modelValue'] as const;

export function useInputEmits(): Writable<typeof inputEmits> {
    return [...inputEmits];
}

export function useInputProps(): typeof inputProps {
    return inputProps;
}

export function extractInputProps<T extends ExtractPropTypes<typeof inputProps>>(
    props: T,
): Pick<T, keyof typeof inputProps> {
    return extractComponentProps(props, inputProps);
}
