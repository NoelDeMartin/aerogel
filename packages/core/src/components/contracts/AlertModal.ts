import { computed } from 'vue';

import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';

export interface AlertModalProps {
    title?: string;
    message: string;
}

export interface AlertModalExpose extends ModalExpose<void> {}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useAlertModal(props: AlertModalProps) {
    const renderedTitle = computed(() => props.title ?? translateWithDefault('ui.alert', 'Alert'));
    const titleHidden = computed(() => !props.title);

    return { renderedTitle, titleHidden };
}
