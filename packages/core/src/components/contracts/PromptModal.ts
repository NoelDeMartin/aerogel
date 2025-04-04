import { computed } from 'vue';

import { requiredStringInput, useForm } from '@aerogel/core/forms';
import { translateWithDefault } from '@aerogel/core/lang';
import type { IButtonVariants } from '@aerogel/core/components/contracts/Button';

export interface IPromptModalProps {
    title?: string;
    message: string;
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    acceptText?: string;
    acceptVariant?: IButtonVariants;
    cancelText?: string;
    cancelVariant?: IButtonVariants;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function usePromptModal(props: IPromptModalProps) {
    const form = useForm({
        draft: requiredStringInput(props.defaultValue ?? ''),
    });
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { form, renderedAcceptText, renderedCancelText };
}
