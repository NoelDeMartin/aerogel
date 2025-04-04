import { computed } from 'vue';

import { requiredStringInput, useForm } from '@aerogel/core/forms';
import { translateWithDefault } from '@aerogel/core/lang';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';

export interface PromptModalProps {
    title?: string;
    message: string;
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    acceptText?: string;
    acceptVariant?: ButtonVariant;
    cancelText?: string;
    cancelVariant?: ButtonVariant;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function usePromptModal(props: PromptModalProps) {
    const form = useForm({
        draft: requiredStringInput(props.defaultValue ?? ''),
    });
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { form, renderedAcceptText, renderedCancelText };
}
