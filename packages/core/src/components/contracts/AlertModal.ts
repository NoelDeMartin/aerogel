import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import { computed } from 'vue';

export interface AlertModalProps {
    title?: string;
    message: string;
}

export interface AlertModalExpose extends ModalExpose {}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function useAlertModal(props: AlertModalProps) {
    const renderedTitle = computed(() => props.title ?? translateWithDefault('ui.alert', 'Alert'));
    const titleHidden = computed(() => !props.title);

    return { renderedTitle, titleHidden };
}
