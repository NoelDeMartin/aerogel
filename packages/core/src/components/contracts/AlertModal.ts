import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';

export interface AlertModalProps {
    title?: string;
    message: string;
}

export interface AlertModalExpose extends ModalExpose<void> {}
