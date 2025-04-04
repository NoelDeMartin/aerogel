export interface IModalProps {
    persistent?: boolean;
    title?: string;
    description?: string;
}

export interface IModalSlots {
    default(props: { close(result?: unknown): Promise<void> }): unknown;
}
