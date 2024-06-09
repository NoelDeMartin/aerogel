import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty, SubPartial } from '@noeldemartin/utils';

import { Colors } from '@/components/constants';
import { enumProp, requiredStringProp, stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';

export const promptModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    label: stringProp(),
    defaultValue: stringProp(),
    placeholder: stringProp(),
    acceptText: stringProp(),
    acceptColor: enumProp(Colors, Colors.Primary),
    cancelText: stringProp(),
    cancelColor: enumProp(Colors, Colors.Clear),
};

export type AGPromptModalProps = SubPartial<
    ObjectWithoutEmpty<ExtractPropTypes<typeof promptModalProps>>,
    'acceptColor' | 'cancelColor'
>;

export function usePromptModalProps(): typeof promptModalProps {
    return promptModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function usePromptModal(props: ExtractPropTypes<typeof promptModalProps>) {
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { renderedAcceptText, renderedCancelText };
}
