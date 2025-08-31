export type ToastVariant = 'secondary' | 'warning' | 'danger';

export interface ToastAction {
    label: string;
    dismiss?: boolean;
    click?(): unknown;
}

export interface ToastProps {
    message?: string;
    actions?: ToastAction[];
    variant?: ToastVariant;
}

export interface ToastExpose {}
