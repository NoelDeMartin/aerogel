import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import { requiredStringProp, stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';

export const promptModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    label: stringProp(),
    defaultValue: stringProp(),
    placeholder: stringProp(),
    acceptText: stringProp(),
    cancelText: stringProp(),
};

export type AGPromptModalProps = ObjectWithoutEmpty<ExtractPropTypes<typeof promptModalProps>>;

export function usePromptModalProps(): typeof promptModalProps {
    return promptModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function usePromptModal(props: ExtractPropTypes<typeof promptModalProps>) {
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { renderedAcceptText, renderedCancelText };
}
