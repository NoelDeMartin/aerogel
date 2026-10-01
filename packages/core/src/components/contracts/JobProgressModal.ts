import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';
import type { Job } from 'soukai-bis';

export interface JobProgressModalProps {
    job: Job;
    message?: string;
}

export interface JobProgressModalExpose extends ModalExpose {}
