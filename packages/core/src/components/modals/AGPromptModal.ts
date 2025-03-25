import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithout, Pretty, SubPartial } from '@noeldemartin/utils';

import { Colors } from '@aerogel/core/components/constants';
import { enumProp, requiredStringProp, stringProp } from '@aerogel/core/utils';
import { translateWithDefault } from '@aerogel/core/lang';
import type { AcceptRefs } from '@aerogel/core/utils';

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

export type AGPromptModalProps = Pretty<
    AcceptRefs<
        SubPartial<
            ObjectWithout<ExtractPropTypes<typeof promptModalProps>, null | undefined>,
            'acceptColor' | 'cancelColor'
        >
    >
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
