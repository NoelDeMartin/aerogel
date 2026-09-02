import type { Job } from 'soukai-bis';

import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';

export interface JobProgressModalProps {
    job: Job;
    message?: string;
}

export interface JobProgressModalExpose extends ModalExpose {}
