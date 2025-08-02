import { computed } from 'vue';

import { translateWithDefault } from '@aerogel/core/lang';
import { useForm } from '@aerogel/core/utils/composition/forms';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';
import type { FormFieldDefinition } from '@aerogel/core/forms/FormController';
import type { Nullable } from '@noeldemartin/utils';
import type { ModalEmits, ModalExpose } from '@aerogel/core/components/contracts/Modal';

export type ConfirmModalCheckboxes = Record<string, { label: string; default?: boolean; required?: boolean }>;
export type ConfirmModalResult = boolean | [boolean, Record<string, Nullable<boolean>>];

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

export interface ConfirmModalExpose extends ModalExpose {}

export interface ConfirmModalEmits extends ModalEmits<ConfirmModalResult> {}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useConfirmModal(props: ConfirmModalProps) {
    const form = useForm(
        Object.entries(props.checkboxes ?? {}).reduce(
            (values, [name, checkbox]) => ({
                [name]: {
                    type: 'boolean',
                    default: checkbox.default,
                    required: checkbox.required ? 'required' : undefined,
                },
                ...values,
            }),
            {} as Record<string, FormFieldDefinition<'boolean'>>,
        ),
    );

    const renderedTitle = computed(() => props.title ?? translateWithDefault('ui.confirm', 'Confirm'));
    const titleHidden = computed(() => !props.title);
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { form, renderedTitle, titleHidden, renderedAcceptText, renderedCancelText };
}
