import { computed } from 'vue';
import type { ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import { requiredStringProp, stringProp } from '@/utils';
import { translateWithDefault } from '@/lang';

export const confirmModalProps = {
    title: stringProp(),
    message: requiredStringProp(),
    acceptText: stringProp(),
    cancelText: stringProp(),
};

export type AGConfirmModalProps = ObjectWithoutEmpty<ExtractPropTypes<typeof confirmModalProps>>;

export function useConfirmModalProps(): typeof confirmModalProps {
    return confirmModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useConfirmModal(props: ExtractPropTypes<typeof confirmModalProps>) {
    const renderedAcceptText = computed(() => props.acceptText ?? translateWithDefault('ui.accept', 'Ok'));
    const renderedCancelText = computed(() => props.cancelText ?? translateWithDefault('ui.cancel', 'Cancel'));

    return { renderedAcceptText, renderedCancelText };
}
