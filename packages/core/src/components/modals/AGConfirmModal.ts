import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithout, Pretty, SubPartial } from '@noeldemartin/utils';

import { Colors } from '@aerogel/core/components/constants';
import { booleanProp, enumProp, objectProp, requiredStringProp, stringProp } from '@aerogel/core/utils';
import { translateWithDefault } from '@aerogel/core/lang';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { ConfirmCheckboxes } from '@aerogel/core/ui';

export const confirmModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    acceptText: stringProp(),
    acceptColor: enumProp(Colors, Colors.Primary),
    cancelText: stringProp(),
    cancelColor: enumProp(Colors, Colors.Clear),
    checkboxes: objectProp<ConfirmCheckboxes>(),
    actions: objectProp<Record<string, () => unknown>>(),
    required: booleanProp(false),
};

export type AGConfirmModalProps = Pretty<
    AcceptRefs<
        SubPartial<
            ObjectWithout<ExtractPropTypes<typeof confirmModalProps>, null | undefined>,
            'acceptColor' | 'cancelColor'
        >
    >
>;

export function useConfirmModalProps(): typeof confirmModalProps {
    return confirmModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useConfirmModal(props: ExtractPropTypes<typeof confirmModalProps>) {
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { renderedAcceptText, renderedCancelText };
}
