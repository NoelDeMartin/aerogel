import { computed } from 'vue';

import { translateWithDefault } from '@aerogel/core/lang';
import { FormFieldTypes, useForm } from '@aerogel/core/forms';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';
import type { FormFieldDefinition } from '@aerogel/core/forms';

export type ConfirmModalCheckboxes = Record<string, { label: string; default?: boolean; required?: boolean }>;

export interface ConfirmModalProps {
    title?: string;
    message: string;
    acceptText?: string;
    acceptVariant?: ButtonVariant;
    cancelText?: string;
    cancelVariant?: ButtonVariant;
    checkboxes?: ConfirmModalCheckboxes;
    actions?: Record<string, () => unknown>;
    required?: boolean;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useConfirmModal(props: ConfirmModalProps) {
    const form = useForm(
        Object.entries(props.checkboxes ?? {}).reduce(
            (values, [name, checkbox]) => ({
                [name]: {
                    type: FormFieldTypes.Boolean,
                    default: checkbox.default,
                    required: checkbox.required ? 'required' : undefined,
                },
                ...values,
            }),
            {} as Record<string, FormFieldDefinition>,
        ),
    );
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { form, renderedAcceptText, renderedCancelText };
}
