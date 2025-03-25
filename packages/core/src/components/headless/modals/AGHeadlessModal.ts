import { computed } from 'vue';
import type { ExtractPropTypes, Ref } from 'vue';

import { booleanProp, stringProp } from '@aerogel/core/utils';
import { extractComponentProps } from '@aerogel/core/components/utils';
import type { IAGModal } from '@aerogel/core/components/modals/AGModal';

export interface IAGHeadlessModal extends IAGModal {}

export interface IAGHeadlessModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}

export const modalProps = {
    cancellable: booleanProp(true),
    inline: booleanProp(),
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
        inline: computed(() => !!$modal.value?.inline),
        cancellable: computed(() => !!$modal.value?.cancellable),
        close: async () => $modal.value?.close(),
    };
}
