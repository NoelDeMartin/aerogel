import { computed } from 'vue';
import type { Ref } from 'vue';

import { booleanProp, stringProp } from '@aerogel/core/utils/vue';
import { extractComponentProps } from '@aerogel/core/components/utils';
import type { ComponentPropDefinitions } from '@aerogel/core/components/utils';
import type { ComponentProps } from '@aerogel/core/utils/vue';
import type { IModal, IModalProps } from '@aerogel/core/components/contracts/Modal';

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
        title: stringProp(),
    };
}

export function modalExpose($modal: Ref<IAGHeadlessModal | undefined>): IModal {
    return {
        cancellable: computed(() => !!$modal.value?.cancellable),
        close: async () => $modal.value?.close(),
    };
}
