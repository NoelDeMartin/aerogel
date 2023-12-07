import type { IAGModal } from '@/components/modals/AGModal';
import { booleanProp } from '@/utils';

export interface IAGHeadlessModal extends IAGModal {}

export interface IAGHeadlessModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}

export const modalProps = {
    cancellable: booleanProp(true),
};

export function useModalProps(): typeof modalProps {
    return modalProps;
}
