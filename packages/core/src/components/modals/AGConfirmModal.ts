import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty, SubPartial } from '@noeldemartin/utils';

import { Colors } from '@/components/constants';
import { enumProp, requiredStringProp, stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';

export const confirmModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    acceptText: stringProp(),
    acceptColor: enumProp(Colors, Colors.Primary),
    cancelText: stringProp(),
    cancelColor: enumProp(Colors, Colors.Clear),
};

export type AGConfirmModalProps = SubPartial<
    ObjectWithoutEmpty<ExtractPropTypes<typeof confirmModalProps>>,
    'acceptColor' | 'cancelColor'
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
