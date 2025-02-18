import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithout, SubPartial } from '@noeldemartin/utils';

import { Colors } from '@/components/constants';
import { enumProp, objectProp, requiredStringProp, stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';
import type { ConfirmCheckboxes } from '@/ui';

export const confirmModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    acceptText: stringProp(),
    acceptColor: enumProp(Colors, Colors.Primary),
    cancelText: stringProp(),
    cancelColor: enumProp(Colors, Colors.Clear),
    checkboxes: objectProp<ConfirmCheckboxes>(),
    actions: objectProp<Record<string, () => unknown>>(),
};

export type AGConfirmModalProps = SubPartial<
    ObjectWithout<ExtractPropTypes<typeof confirmModalProps>, null | undefined>,
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
