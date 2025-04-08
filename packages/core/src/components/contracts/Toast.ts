export interface ToastAction {
    label: string;
    dismiss?: boolean;
    handler?(): unknown;
}

export type ToastVariant = 'secondary' | 'danger';

export interface ToastProps {
    message?: string;
    actions?: ToastAction[];
    variant?: ToastVariant;
}
