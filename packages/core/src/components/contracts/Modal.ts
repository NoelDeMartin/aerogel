export interface ModalProps {
    persistent?: boolean;
    title?: string;
    description?: string;
}

export interface ModalSlots {
    default(props: { close(result?: unknown): Promise<void> }): unknown;
}
