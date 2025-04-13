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

export interface ModalSlots<Result = void> {
    default(props: { close(result?: Result): Promise<void> }): unknown;
}

export interface ModalExpose<Result = void> {
    close(result?: Result): Promise<void>;
    $content: ModalContentInstance;
}
