import { computed } from 'vue';

import { useForm } from '@aerogel/core/utils/composition/forms';
import { requiredStringInput } from '@aerogel/core/forms/utils';
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
    const renderedTitle = computed(() => props.title ?? props.message);
    const renderedMessage = computed(() => (props.title ? props.message : null));
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { form, renderedTitle, renderedMessage, renderedAcceptText, renderedCancelText };
}
