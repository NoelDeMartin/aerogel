import { computed } from 'vue';
import type { ExtractPropTypes, Ref } from 'vue';

import { booleanProp, stringProp } from '@/utils';
import { extractComponentProps } from '@/components/utils';
import type { IAGModal } from '@/components/modals/AGModal';

export interface IAGHeadlessModal extends IAGModal {}

export interface IAGHeadlessModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}

export const modalProps = {
    cancellable: booleanProp(true),
    title: stringProp(),
};

export function useModalProps(): typeof modalProps {
    return modalProps;
}

export function extractModalProps<T extends ExtractPropTypes<typeof modalProps>>(
    props: T,
): Pick<T, keyof typeof modalProps> {
    return extractComponentProps(props, modalProps);
}

export function useModalExpose($modal: Ref<IAGHeadlessModal | undefined>): IAGModal {
    return {
        close: async () => $modal.value?.close(),
        cancellable: computed(() => !!$modal.value?.cancellable),
    };
}
