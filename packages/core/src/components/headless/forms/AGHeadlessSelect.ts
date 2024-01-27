import type { ComputedRef, DeepReadonly, ExtractPropTypes, Ref } from 'vue';
import type { Writable } from '@noeldemartin/utils';

import { mixedProp, requiredArrayProp, stringProp } from '@/utils/vue';
import { extractComponentProps } from '@/components/utils';
import type { FormFieldValue } from '@/forms/Form';

export interface IAGHeadlessSelect {
    id: string;
    label: ComputedRef<string | null>;
    noSelectionText: ComputedRef<string>;
    buttonText: ComputedRef<string>;
    renderText: ComputedRef<(value: FormFieldValue) => string>;
    selectedOption: ComputedRef<FormFieldValue | null>;
    options: ComputedRef<FormFieldValue[]>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: FormFieldValue): void;
}

export const selectProps = {
    name: stringProp(),
    label: stringProp(),
    options: requiredArrayProp<FormFieldValue>(),
    noSelectionText: stringProp(),
    optionsText: mixedProp<string | ((option: FormFieldValue) => string)>(),
};

export const selectEmits = ['update:modelValue'] as const;

export function useSelectProps(): typeof selectProps {
    return selectProps;
}

export function useSelectEmits(): Writable<typeof selectEmits> {
    return [...selectEmits];
}

export function extractSelectProps<T extends ExtractPropTypes<typeof selectProps>>(
    props: T,
): Pick<T, keyof typeof selectProps> {
    return extractComponentProps(props, selectProps);
}
