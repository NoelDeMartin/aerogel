import type { Nullable } from '@noeldemartin/utils';
import type { DialogContent } from 'reka-ui';

export type ModalContentInstance = Nullable<InstanceType<typeof DialogContent>>;

export interface ModalProps {
    persistent?: boolean;
    title?: string;
    description?: string;
}

export interface ModalSlots {
    default(props: { close(result?: unknown): Promise<void> }): unknown;
}

export interface ModalExpose {
    close(result?: unknown): Promise<void>;
    $content: ModalContentInstance;
}
