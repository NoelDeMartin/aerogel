export interface ToastAction {
    label: string;
    dismiss?: boolean;
    click?(): unknown;
}

export type ToastVariant = 'secondary' | 'danger';

export interface ToastProps {
    message?: string;
    actions?: ToastAction[];
    variant?: ToastVariant;
}
