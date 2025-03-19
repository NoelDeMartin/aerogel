import { computed } from 'vue';
import type { Ref } from 'vue';

import { booleanProp, stringProp } from '@/utils/vue';
import { extractComponentProps } from '@/components/utils';
import type { ComponentPropDefinitions } from '@/components/utils';
import type { ComponentProps } from '@/utils/vue';
import type { IModal, IModalProps } from '@/components/contracts/Modal';

export interface IAGHeadlessModal extends IModal {}

export interface IAGHeadlessModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}

export function extractModalProps<T extends IModalProps>(props: T): ComponentProps<IModalProps> {
    return extractComponentProps(props, modalProps());
}

export function modalProps(): ComponentPropDefinitions<IModalProps> {
    return {
        cancellable: booleanProp(true),
        description: stringProp(),
        inline: booleanProp(),
        title: stringProp(),
    };
}

export function modalExpose($modal: Ref<IAGHeadlessModal | undefined>): IModal {
    return {
        inline: computed(() => !!$modal.value?.inline),
        cancellable: computed(() => !!$modal.value?.cancellable),
        close: async () => $modal.value?.close(),
    };
}
