import type { Nullable } from '@noeldemartin/utils';
import type { DialogContent } from 'reka-ui';

export type ModalContentInstance = Nullable<InstanceType<typeof DialogContent>>;

export interface ModalProps {
    persistent?: boolean;
    title?: string;
    titleHidden?: boolean;
    description?: string;
    descriptionHidden?: boolean;
}

export interface ModalSlots<Result = never> {
    default(props: { close(result?: Result): Promise<void> }): unknown;
}

export interface ModalExpose {
    $content: ModalContentInstance;
}

export interface ModalEmits<Result = never> {
    (event: 'close', payload: Result): void;
}
